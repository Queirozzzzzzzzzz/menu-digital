import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import session from "models/session";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("POST to /api/v1/sessions", () => {
  describe("No user", () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
    });

    test("With non existent username", async () => {
      const reqB = new RequestBuilder("/api/v1/sessions");
      await orchestrator.createAdmin();

      const { res, resBody } = await reqB.post({
        username: "Non existent username",
        password: process.env.ADMIN_PASSWORD,
      });

      expect(res.status).toBe(404);
      expect(resBody.name).toBe("NotFoundError");
      expect(resBody.message).toBe(
        "O usuário informado não foi encontrado no sistema.",
      );
      expect(resBody.action).toBe(
        "Verifique se o username está digitado corretamente.",
      );
      expect(resBody.status_code).toBe(404);
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
      expect(resBody.error_location_code).toBe(
        "MODEL:USER:FIND_BY_USERNAME:NOT_FOUND",
      );
      expect(resBody.key).toBe("username");
    });

    test("With invalid password", async () => {
      const reqB = new RequestBuilder("/api/v1/sessions");
      await orchestrator.createAdmin();

      const { res, resBody } = await reqB.post({
        username: process.env.ADMIN_USERNAME,
        password: "invalidpassword",
      });

      expect(res.status).toBe(401);
      expect(resBody.name).toBe("UnauthorizedError");
      expect(resBody.message).toBe("Dados não conferem.");
      expect(resBody.action).toBe(
        "Verifique se os dados enviados estão corretos.",
      );
      expect(resBody.status_code).toBe(401);
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
      expect(resBody.error_location_code).toBe(
        "CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH",
      );
    });

    test("With valid credentials", async () => {
      const reqB = new RequestBuilder("/api/v1/sessions");
      const adminUser = await orchestrator.createAdmin();

      const { res, resBody } = await reqB.post({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
      });

      expect(res.status).toBe(201);
      expect(resBody.token.length).toEqual(96);
      expect(resBody.user_id).toEqual(adminUser.id);
      expect(Date.parse(resBody.expires_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.updated_at)).not.toEqual(NaN);

      const sessionObjectInDatabase = await session.findById(resBody.id);
      expect(sessionObjectInDatabase.user_id).toEqual(adminUser.id);

      const parsedCookies = orchestrator.parseSetCookies(res);
      expect(parsedCookies.session_id.name).toEqual("session_id");
      expect(parsedCookies.session_id.value).toEqual(resBody.token);
      expect(parsedCookies.session_id.maxAge).toEqual(60 * 60 * 24 * 30);
      expect(parsedCookies.session_id.path).toEqual("/");
      expect(parsedCookies.session_id.httpOnly).toEqual(true);
    });
  });
});
