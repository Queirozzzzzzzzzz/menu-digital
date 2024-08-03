import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/products", () => {
  describe("No user", () => {
    test("With unique name and full valid data", async () => {
      const reqB = new RequestBuilder("/api/v1/products");

      const values = {
        ingredients_ids: [1, 2],
        product_name: "Product name",
        product_category: "coffee",
        price: "22.90",
        picture: "https://image_url_path.jpg",
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

    test("With unique name and full valid data", async () => {
      const reqB = new RequestBuilder("/api/v1/products");
      await reqB.buildAdmin();

      const values = {
        ingredients_ids: [1, 2],
        product_name: "Product name",
        product_category: "coffee",
        price: "22.90",
        picture: "https://image_url_path.jpg",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(201);
      expect(resBody.ingredients_ids).toEqual([1, 2]);
      expect(resBody.name).toEqual("Product name");
      expect(resBody.category).toEqual("coffee");
      expect(resBody.price).toEqual("22.90");
      expect(resBody.picture).toEqual("https://image_url_path.jpg");
    });

    test("With unique name, valid data and without ingredients_ids", async () => {
      const reqB = new RequestBuilder("/api/v1/products");
      await reqB.buildAdmin();

      const values = {
        product_name: "Product name",
        product_category: "coffee",
        price: "22.90",
        picture: "https://image_url_path.jpg",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(201);
      expect(resBody.ingredients_ids).toEqual(null);
      expect(resBody.name).toEqual("Product name");
      expect(resBody.category).toEqual("coffee");
      expect(resBody.price).toEqual("22.90");
      expect(resBody.picture).toEqual("https://image_url_path.jpg");
    });

    test("With non-unique name and full valid data", async () => {
      const reqB = new RequestBuilder("/api/v1/products");
      await reqB.buildAdmin();

      const values = {
        ingredients_ids: [1, 2],
        product_name: "Product name",
        product_category: "coffee",
        price: "22.90",
        picture: "https://image_url_path.jpg",
      };

      const { res: res1, resBody: resBody1 } = await reqB.post(values);

      expect(res1.status).toBe(201);
      expect(resBody1.ingredients_ids).toEqual([1, 2]);
      expect(resBody1.name).toEqual("Product name");
      expect(resBody1.category).toEqual("coffee");
      expect(resBody1.price).toEqual("22.90");
      expect(resBody1.picture).toEqual("https://image_url_path.jpg");

      const { res: res2, resBody: resBody2 } = await reqB.post(values);

      expect(res2.status).toBe(400);
      expect(resBody2.name).toBe("ValidationError");
      expect(resBody2.message).toBe("O conteúdo enviado parece ser duplicado.");
      expect(resBody2.action).toBe(
        'Utilize um "title" ou "slug" com começo diferente.',
      );
      expect(resBody2.status_code).toBe(400);
      expect(uuidVersion(resBody2.error_id)).toEqual(4);
      expect(uuidVersion(resBody2.request_id)).toEqual(4);
      expect(resBody2.error_location_code).toBe(
        "MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS",
      );
      expect(resBody2.key).toBe("slug");
    });

    test("With unique name but without picture", async () => {
      const reqB = new RequestBuilder("/api/v1/products");
      await reqB.buildAdmin();

      const values = {
        ingredients_ids: [1, 2],
        product_name: "Product name",
        product_category: "coffee",
        price: "22.90",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(400);
      expect(resBody.name).toBe("ValidationError");
      expect(resBody.message).toBe('"picture" é um campo obrigatório.');
      expect(resBody.action).toBe(
        "Ajuste os dados enviados e tente novamente.",
      );
      expect(resBody.status_code).toBe(400);
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
      expect(resBody.error_location_code).toBe("MODEL:VALIDATOR:FINAL_SCHEMA");
      expect(resBody.key).toBe("picture");
    });

    test("With unique name but invalid product_category", async () => {
      const reqB = new RequestBuilder("/api/v1/products");
      await reqB.buildAdmin();

      const values = {
        ingredients_ids: [1, 2],
        product_name: "Product name",
        product_category: "invalid",
        price: "22.90",
        picture: "https://image_url_path.jpg",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(400);
      expect(resBody.name).toBe("ValidationError");
      expect(resBody.message).toBe(
        '"product_category" deve possuir um dos seguintes valores: "coffee", "sweets", "snacks", "teas".',
      );
      expect(resBody.action).toBe(
        "Ajuste os dados enviados e tente novamente.",
      );
      expect(resBody.status_code).toBe(400);
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
      expect(resBody.error_location_code).toBe("MODEL:VALIDATOR:FINAL_SCHEMA");
      expect(resBody.key).toBe("product_category");
    });
  });
});
