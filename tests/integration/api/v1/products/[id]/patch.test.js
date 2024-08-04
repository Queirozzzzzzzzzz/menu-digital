import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import db from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to /api/v1/products", () => {
  describe("No user", () => {
    test("With unique name and full valid data", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);

      const values = {
        ingredients_ids: [1, 2],
        name: "Product name",
        category: "coffees",
        price: "22.90",
        picture: "https://image_url_path.jpg",
      };

      const { res, resBody } = await reqB.patch(values);

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

    test("With no values", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.patch();

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: "Objeto enviado deve ter no mínimo uma chave.",
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "object",
        type: "object.min",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With empty values", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.patch({});

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: "Objeto enviado deve ter no mínimo uma chave.",
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "object",
        type: "object.min",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With unique name and full valid data", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const values = {
        ingredients_ids: [1, 2],
        name: "Product name",
        category: "coffees",
        price: "22.90",
        picture: "https://image_url_path.jpg",
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.ingredients_ids).toEqual([1, 2]);
      expect(resBody.name).toEqual("Product name");
      expect(resBody.category).toEqual("coffees");
      expect(resBody.price).toEqual("22.90");
      expect(resBody.picture).toEqual("https://image_url_path.jpg");
    });

    test("With unique name", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const values = {
        name: "Product name",
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.ingredients_ids).toEqual(testProduct.ingredients_ids);
      expect(resBody.name).toEqual("Product name");
      expect(resBody.category).toEqual(testProduct.category);
      expect(resBody.price).toEqual(testProduct.price);
      expect(resBody.picture).toEqual(testProduct.picture);
    });

    test("With non-unique name", async () => {
      const testProduct = await orchestrator.createProduct();
      const test2Product = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const values = {
        name: test2Product.name,
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: "O nome enviado parece ser duplicado.",
        action: 'Utilize um "nome" diferente.',
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code:
          "MODEL:PRODUCT:CHECK_FOR_PRODUCT_UNIQUENESS:ALREADY_EXISTS",
        key: "name",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With valid ingredients_ids", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const values = {
        ingredients_ids: [1],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.ingredients_ids).toEqual([1]);
      expect(resBody.name).toEqual(testProduct.name);
      expect(resBody.category).toEqual(testProduct.category);
      expect(resBody.price).toEqual(testProduct.price);
      expect(resBody.picture).toEqual(testProduct.picture);
    });

    test("With empty array ingredients_ids", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const values = {
        ingredients_ids: [],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.ingredients_ids).toEqual([]);
      expect(resBody.name).toEqual(testProduct.name);
      expect(resBody.category).toEqual(testProduct.category);
      expect(resBody.price).toEqual(testProduct.price);
      expect(resBody.picture).toEqual(testProduct.picture);
    });

    test("With invalid ingredients_ids", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const values = {
        ingredients_ids: "[1]",
      };

      const { res, resBody } = await reqB.patch(values);
      console.log(resBody);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: '"ingredients_ids" deve ser um array com base válida.',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "ingredients_ids",
        type: "array.base",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With valid data but invalid ingredients_ids", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const values = {
        ingredients_ids: "[1]",
        name: "Product name",
        category: "coffees",
        price: "22.90",
        picture: "https://image_url_path.jpg",
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: '"ingredients_ids" deve ser um array com base válida.',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "ingredients_ids",
        type: "array.base",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);

      const productInDatabase = await db.query({
        text: "SELECT * FROM products WHERE id = $1;",
        values: [testProduct.id],
      });

      expect(productInDatabase.rows[0]).toEqual(testProduct);
    });

    test("With valid category", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const values = {
        category: "teas",
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.ingredients_ids).toEqual(testProduct.ingredients_ids);
      expect(resBody.name).toEqual(testProduct.name);
      expect(resBody.category).toEqual("teas");
      expect(resBody.price).toEqual(testProduct.price);
      expect(resBody.picture).toEqual(testProduct.picture);
    });

    test("With invalid category", async () => {
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);
      await reqB.buildAdmin();

      const values = {
        category: "invalid",
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message:
          '"category" deve possuir um dos seguintes valores: "coffees", "sweets", "snacks", "teas".',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "category",
        type: "any.only",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });
  });
});
