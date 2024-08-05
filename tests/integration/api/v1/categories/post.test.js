import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("POST to /api/v1/categories", () => {
  describe("No user", () => {
    test("Retrieving endpoint", async () => {
      const reqB = new RequestBuilder("/api/v1/categories");
      await orchestrator.createProduct();

      const values = {
        name: "Molho",
      };

      const { res, resBody } = await reqB.post(values);

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
    });

    test("With valid name", async () => {
      const reqB = new RequestBuilder("/api/v1/categories");
      await reqB.buildAdmin();
      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      const product = await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      const values = {
        name: "Molho",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(201);
      expect(resBody.name).toEqual("Molho");
      expect(resBody.status).toEqual("available");
      expect(Date.parse(resBody.created_at)).not.toBe(NaN);
      expect(Date.parse(resBody.updated_at)).not.toBe(NaN);
    });

    test("Wit invalid name", async () => {
      const reqB = new RequestBuilder("/api/v1/categories");
      await reqB.buildAdmin();
      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      await orchestrator.createCategory();

      const values = { name: null };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: '"name" deve ser do tipo String.',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "name",
        type: "string.base",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("Without name", async () => {
      const reqB = new RequestBuilder("/api/v1/categories");
      await reqB.buildAdmin();
      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      const product = await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      await orchestrator.createCategory();

      const values = {};

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: '"name" é um campo obrigatório.',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "name",
        type: "any.required",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With duplicated name", async () => {
      const reqB = new RequestBuilder("/api/v1/categories");
      await reqB.buildAdmin();
      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      const product = await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      const category = await orchestrator.createCategory();

      const values = {
        name: category.name,
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: "O nome enviado parece ser duplicado.",
        action: 'Utilize um "nome" diferente.',
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code:
          "MODEL:CATEGORY:CHECK_FOR_CATEGORY_UNIQUENESS:ALREADY_EXISTS",
        key: "name",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });
  });
});
