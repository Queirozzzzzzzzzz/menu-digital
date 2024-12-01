import retry from "async-retry";
import setCookieParser from "set-cookie-parser";
import { faker } from "@faker-js/faker";

import db from "infra/database";
import migrator from "infra/migrator.js";
import webserver from "infra/webserver";
import user from "models/user";
import session from "models/session";
import product from "models/product";
import ingredient from "models/ingredient";
import order from "models/order";

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

async function createProduct(values = {}) {
  const info = {
    ingredients_ids: values.ingredients_ids || [],
    name: values.name || getFakeName(),
    category: values.category || "coffees",
    price: values.price || "1.90",
    picture: values.picture || "https://url_path.jpg",
  };

  let productObj = await product.create(info);

  if (values.status)
    productObj = await setProductStatus(productObj.name, values.status);

  return productObj;
}

async function setProductStatus(productName, status) {
  return await product.setStatus(productName, status);
}

async function createIngredient(values = {}) {
  const info = {
    name: values.name || getFakeName(),
    value: values.value || null,
    price: values.price || null,
  };

  return await ingredient.create(info);
}

async function createOrder(values = {}) {
  const info = {
    order_id: values.order_id || getFakeOrderId(),
    product_id: values.product_id,
    price: values.price || 47.27,
    table_number: values.table_number || 12,
    observation: values.observation,
    additionalIngredients: values.additionalIngredients,
    removedIngredients: values.removedIngredients,
  };

  let orderObj = await order.create(info);

  if (values.status)
    orderObj = await setOrderStatus(orderObj.order_id, [values.status]);

  return orderObj;
}

async function setOrderStatus(id, status = []) {
  const newOrder = await order.setStatus(id, status);
  return newOrder;
}

// Functions

const usedFakeNames = new Set();
function getFakeName() {
  let name;
  while (!name) {
    name = faker.internet.userName().replace(/[_.-]/g, "").substring(0, 29);

    if (usedFakeNames.has(name)) {
      name = undefined;
    } else {
      usedFakeNames.add(name);
    }
  }

  return name;
}

function parseSetCookies(res) {
  const setCookieHeaderValues = res.headers.get("set-cookie");
  const parsedCookies = setCookieParser.parse(setCookieHeaderValues, {
    map: true,
  });
  return parsedCookies;
}

function getFakeOrderId() {
  const part1 = Math.floor(10000 + Math.random() * 90000).toString();
  const part2 = Math.floor(1000 + Math.random() * 9000).toString();
  return `${part1}-${part2}`;
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
  addFeaturesToUser,
  createProduct,
  setProductStatus,
  createIngredient,
  createOrder,
};

export default orchestrator;
