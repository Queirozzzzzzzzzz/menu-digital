import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("POST to /api/v1/orders", () => {
  describe("No user", () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
    });

    test("With full valid data", async () => {
      const reqB = new RequestBuilder("/api/v1/orders");

      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      const product = await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      const values = {
        product_id: product.id,
        price: 48.99,
        table_number: 8,
        observation: "Observação.",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(201);
      expect(resBody.product_id).toEqual(product.id);
      expect(resBody.price).toEqual("48.99");
      expect(resBody.table_number).toEqual(8);
      expect(resBody.observation).toEqual("Observação.");
      expect(resBody.status).toEqual("pending");
      expect(Date.parse(resBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.updated_at)).not.toEqual(NaN);
    });

    test("With valid data and without observation", async () => {
      const reqB = new RequestBuilder("/api/v1/orders");

      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      const product = await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      const values = {
        product_id: product.id,
        price: 48.99,
        table_number: 8,
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(201);
      expect(resBody.product_id).toEqual(product.id);
      expect(resBody.price).toEqual("48.99");
      expect(resBody.table_number).toEqual(8);
      expect(resBody.observation).toEqual(null);
      expect(resBody.status).toEqual("pending");
      expect(Date.parse(resBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.updated_at)).not.toEqual(NaN);
    });

    test("With invalid product_id", async () => {
      const reqB = new RequestBuilder("/api/v1/orders");

      const values = {
        product_id: 2,
        price: 48.99,
        table_number: 8,
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(404);
      expect(resBody).toEqual({
        name: "NotFoundError",
        message: "O produto selecionado não foi encontrado.",
        action: 'Verifique o "product_id" utilizado e tente novamente.',
        status_code: 404,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:ORDER:CHECK_FOR_ORDER_PRODUCT_ID:NOT_FOUND",
        key: "product_id",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("Without price", async () => {
      const reqB = new RequestBuilder("/api/v1/orders");

      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      const product = await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      const values = {
        product_id: product.id,
        table_number: 8,
        observation: "Observação.",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: '"price" é um campo obrigatório.',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "price",
        type: "any.required",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("Without table_number", async () => {
      const reqB = new RequestBuilder("/api/v1/orders");

      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      const product = await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      const values = {
        product_id: product.id,
        price: 48.99,
        observation: "Observação.",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: '"table_number" é um campo obrigatório.',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "table_number",
        type: "any.required",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("Without product_id", async () => {
      const reqB = new RequestBuilder("/api/v1/orders");

      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      const product = await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      const values = {
        price: 48.99,
        table_number: 8,
        observation: "Observação.",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: '"product_id" é um campo obrigatório.',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "product_id",
        type: "any.required",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });
  });
});
