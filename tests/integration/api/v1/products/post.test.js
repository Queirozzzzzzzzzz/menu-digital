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
  });
});
