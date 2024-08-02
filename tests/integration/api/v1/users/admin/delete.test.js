import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("DELETE /api/v1/users/admin", () => {
  describe("No user", () => {
    test("Action", async () => {
      const reqB = new RequestBuilder("/api/v1/users/admin");

      const { res, resBody } = await reqB.delete({
        username: process.env.ADMIN_USERNAME,
      });

      expect(res.status).toBe(403);
      expect(resBody.name).toEqual("ForbiddenError");
      expect(resBody.message).toEqual("Usuário não encontrado.");
      expect(resBody.action).toEqual("Verifique se o usuário está logado.");
      expect(resBody.status_code).toBe(403);
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
      expect(resBody.error_location_code).toEqual(
        "MODEL:AUTHORIZATION:CAN_REQUEST:USER_NOT_FOUND",
      );
    });
  });

  describe("Admin user", () => {
    test("Action", async () => {
      const reqB = new RequestBuilder("/api/v1/users/admin");
      const adminUser = await reqB.buildAdmin();

      const { res, resBody } = await reqB.delete({
        username: process.env.ADMIN_USERNAME,
      });

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(adminUser.id);
      expect(resBody.username).toEqual(adminUser.username);
      expect(resBody.password).toEqual(adminUser.password);
      expect(Date.parse(resBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.updated_at)).not.toEqual(NaN);
    });
  });
});
