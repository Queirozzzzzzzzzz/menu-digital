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

      const ingredients = await Promise.all([
        orchestrator.createIngredient(),
        orchestrator.createIngredient(),
        orchestrator.createIngredient(),
      ]);

      const product = await orchestrator.createProduct({
        ingredients_ids: ingredients.map((i) => i.id),
      });

      const [ingredient1, ingredient2] = ingredients;

      const additionalIngredientsInput = [
        { ingredient_id: ingredient1.id, multiplied: 2, price: 8.99 },
      ];

      const values = {
        order_id: '209304-2094',
        product_id: product.id,
        price: 48.99,
        table_number: 8,
        observation: "Observação.",
        additional_ingredients: additionalIngredientsInput,
        removed_ingredients: [ingredient2.id],
      };

      const additionalIngredientsOutput = additionalIngredientsInput.map(
        ({ ingredient_id, ...rest }) => ({
          name: ingredients.find((i) => i.id === ingredient_id).name,
          ...rest,
        }),
      );

      let removedIngredientsOutput = [];
      removedIngredientsOutput.push({ name: ingredient2.name });

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(201);
      expect(resBody).toMatchObject({
        product_id: product.id,
        price: "48.99",
        table_number: 8,
        observation: "Observação.",
        status: "pending",
        additional_ingredients: additionalIngredientsOutput,
        removed_ingredients: removedIngredientsOutput,
      });
      expect(
        [resBody.created_at, resBody.updated_at].every(
          (date) => !isNaN(Date.parse(date)),
        ),
      ).toBeTruthy();
    });

    test("With invalid additional_ingredients", async () => {
      const reqB = new RequestBuilder("/api/v1/orders");

      const product = await orchestrator.createProduct();

      const additionalIngredientsInput = [
        { ingredient_id: 1, multiplied: 2, price: 8.99 },
      ];

      const values = {
        order_id: '209304-2094',
        product_id: product.id,
        price: 48.99,
        table_number: 8,
        observation: "Observação.",
        additional_ingredients: additionalIngredientsInput,
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(404);
      expect(resBody).toEqual({
        name: "NotFoundError",
        message: "O ingrediente selecionado não foi encontrado.",
        action: 'Verifique o "ingredient_id" utilizado e tente novamente.',
        status_code: 404,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code:
          "MODEL:ORDER:CHECK_FOR_ORDER_INGREDIENT_ID:NOT_FOUND",
        key: "ingredient_id",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With invalid removed_ingredients", async () => {
      const reqB = new RequestBuilder("/api/v1/orders");

      const product = await orchestrator.createProduct();

      const removedIngredientsInput = [1];

      const values = {
        order_id: '209304-2094',
        product_id: product.id,
        price: 48.99,
        table_number: 8,
        observation: "Observação.",
        removed_ingredients: removedIngredientsInput,
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(404);
      expect(resBody).toEqual({
        name: "NotFoundError",
        message: "O ingrediente selecionado não foi encontrado.",
        action: 'Verifique o "ingredient_id" utilizado e tente novamente.',
        status_code: 404,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code:
          "MODEL:ORDER:CHECK_FOR_ORDER_INGREDIENT_ID:NOT_FOUND",
        key: "ingredient_id",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With valid data and without observation", async () => {
      const reqB = new RequestBuilder("/api/v1/orders");

      const ingredient1 = await orchestrator.createIngredient();
      const ingredient2 = await orchestrator.createIngredient();
      const product = await orchestrator.createProduct({
        ingredients_ids: [ingredient1.id, ingredient2.id],
      });

      const values = {
        order_id: '209304-2094',
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
        order_id: '209304-2094',
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
        order_id: '209304-2094',
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
        order_id: '209304-2094',
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
        order_id: '209304-2094',
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
