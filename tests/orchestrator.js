import retry from "async-retry";
import setCookieParser from "set-cookie-parser";

import db from "infra/database";
import migrator from "infra/migrator.js";
import webserver from "infra/webserver";
import user from "models/user";
import session from "models/session";

if (process.env.NODE_ENV !== "test") {
  throw new Error({
    message: "Orchestrator should only be used in tests",
  });
}

const webserverUrl = webserver.host;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForDatabase();

  async function waitForWebServer() {
    return await retry(
      async (bail, tries) => {
        if (tries >= 25) {
          console.log(
            `> Trying to connect to Webserver #${tries}. Are you running the server with "npm run dev"?`,
          );
        }
        await fetch(`${webserverUrl}/api/v1/status`);
      },
      {
        retries: 50,
        minTimeout: 10,
        maxTimeout: 1000,
        factor: 1.1,
      },
    );
  }

  async function waitForDatabase() {
    return await retry(
      async (bail, tries) => {
        if (tries >= 25) {
          console.log(
            `> Trying to connect to Database #${tries}. Are you running the Postgres container?`,
          );
        }
        const connection = await db.getNewClient();
        await connection.end();
      },
      {
        retries: 50,
        minTimeout: 10,
        maxTimeout: 1000,
        factor: 1.1,
      },
    );
  }
}

async function dropAllTables() {
  const dbClient = await db.getNewClient();
  await dbClient.query("drop schema public cascade; create schema public;");

  await dbClient.end();
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function runTransaction(queryFunction, ...args) {
  const transaction = await db.transaction();
  try {
    await transaction.query("BEGIN");
    const result = await queryFunction(...args, { transaction });
    await transaction.query("COMMIT");
    return result;
  } catch (err) {
    await transaction.query("ROLLBACK");
    throw err;
  } finally {
    await transaction.release();
  }
}

async function createAdmin() {
  const userObj = await user.create({
    username: "admin",
    password: "12345678",
    features: ["admin"],
  });
  await addFeaturesToUser(userObj, ["admin"]);

  const newUserObj = await user.findByUsername("admin");

  return newUserObj;
}

async function createSession(sessionObj) {
  return await session.create(sessionObj.id);
}

async function addFeaturesToUser(userObj, features) {
  return await user.addFeatures(userObj.id, features);
}

function parseSetCookies(res) {
  const setCookieHeaderValues = res.headers.get("set-cookie");
  const parsedCookies = setCookieParser.parse(setCookieHeaderValues, {
    map: true,
  });
  return parsedCookies;
}

const orchestrator = {
  webserverUrl,
  waitForAllServices,
  dropAllTables,
  runPendingMigrations,
  runTransaction,
  createAdmin,
  createSession,
  parseSetCookies,
};

export default orchestrator;
