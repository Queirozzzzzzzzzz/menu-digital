import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import db from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/categories", () => {
  describe("No user", () => {
    test("Retrieving endpoint", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/categories?category_status=available`,
      );

      const { res, resBody } = await reqB.get();

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
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();

      await orchestrator.createProduct();
      await orchestrator.createCategory();
      const disabledCategory = await orchestrator.createCategory();
      await orchestrator.setCategoryStatus(disabledCategory.id, "disabled");

      const categoriesInDb = await db.query("SELECT * FROM categories;");
      expect(categoriesInDb.rows.length).toBe(3);
    });

    test("With 1 valid category_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/categories?category_status=available`,
      );
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(2);
    });

    test("With 2 valid category_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/categories?category_status=available,disabled`,
      );
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(3);
    });

    test("With an invalid category_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/categories?category_status=invalid`,
      );

      const { res, resBody } = await reqB.get();
      await reqB.buildAdmin();

      expect(res.status).toBe(400);
      expect(resBody.name).toEqual("ValidationError");
      expect(resBody.message).toEqual(
        '"category_status[0]" deve possuir um dos seguintes valores: "available", "disabled".',
      );
      expect(resBody.action).toEqual(
        "Ajuste os dados enviados e tente novamente.",
      );
      expect(resBody.status_code).toEqual(400);
      expect(uuidVersion(resBody.error_id)).toBe(4);
      expect(uuidVersion(resBody.request_id)).toBe(4);
      expect(resBody.error_location_code).toEqual(
        "MODEL:VALIDATOR:FINAL_SCHEMA",
      );
      expect(resBody.key).toEqual("object");
      expect(resBody.type).toEqual("any.only");
    });

    test("With a blank category_status array", async () => {
      const reqB = new RequestBuilder(`/api/v1/categories`);

      const { res, resBody } = await reqB.get();
      await reqB.buildAdmin();

      expect(res.status).toBe(400);
      expect(resBody.name).toEqual("ValidationError");
      expect(resBody.message).toEqual(
        "Objeto enviado deve ter no mínimo uma chave.",
      );
      expect(resBody.action).toEqual(
        "Ajuste os dados enviados e tente novamente.",
      );
      expect(resBody.status_code).toEqual(400);
      expect(uuidVersion(resBody.error_id)).toBe(4);
      expect(uuidVersion(resBody.request_id)).toBe(4);
      expect(resBody.error_location_code).toEqual(
        "MODEL:VALIDATOR:FINAL_SCHEMA",
      );
      expect(resBody.key).toEqual("object");
      expect(resBody.type).toEqual("object.min");
    });
  });
});
