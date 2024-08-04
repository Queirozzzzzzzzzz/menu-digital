import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import db from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/ingredients", () => {
  beforeEach(async () => {
    await orchestrator.dropAllTables();
    await orchestrator.runPendingMigrations();
  });

  describe("No user", () => {
    test("Retrieving information", async () => {
      const reqB = new RequestBuilder(`/api/v1/ingredients`);

      await orchestrator.createIngredient({ value: 16, price: 2.99 });
      await orchestrator.createIngredient();

      const ingredientsInDb = await db.query("SELECT * FROM ingredients;");
      expect(ingredientsInDb.rows.length).toBe(2);

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(403);
      expect(resBody).toEqual({
        name: "ForbiddenError",
        message: "Usuário não encontrado.",
        action: "Verifique se o usuário está logado.",
        status_code: 403,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:AUTHORIZATION:CAN_REQUEST:USER_NOT_FOUND",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });
  });

  describe("Admin user", () => {
    test("Retrieving information", async () => {
      const reqB = new RequestBuilder(`/api/v1/ingredients`);
      await reqB.buildAdmin();

      await orchestrator.createIngredient({ value: 16, price: 2.99 });
      await orchestrator.createIngredient();

      const ingredientsInDb = await db.query("SELECT * FROM ingredients;");
      expect(ingredientsInDb.rows.length).toBe(2);

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(2);
    });
  });
});
