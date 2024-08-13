import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/products/[id]", () => {
  describe("No user", () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
    });

    test("With valid id", async () => {
      const testCategory = await orchestrator.createCategory();
      const testProduct = await orchestrator.createProduct();
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(testProduct.id);
      expect(resBody.ingredients_ids).toEqual(testProduct.ingredients_ids);
      expect(resBody.name).toEqual(testProduct.name);
      expect(resBody.category_id).toEqual(testProduct.category_id);
      expect(resBody.status).toEqual(testProduct.status);
      expect(resBody.price).toEqual(testProduct.price);
      expect(resBody.picture).toEqual(testProduct.picture);
      expect(resBody.ingredients).toEqual([]);
      expect(Date.parse(resBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.updated_at)).not.toEqual(NaN);
    });

    test("With valid id and ingredient", async () => {
      const ingredient = await orchestrator.createIngredient({
        value: 5,
        price: 2.99,
      });
      const testProduct = await orchestrator.createProduct({
        ingredients_ids: [ingredient.id],
      });
      const reqB = new RequestBuilder(`/api/v1/products/${testProduct.id}`);

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(testProduct.id);
      expect(resBody.ingredients_ids).toEqual(testProduct.ingredients_ids);
      expect(resBody.name).toEqual(testProduct.name);
      expect(resBody.category_id).toEqual(testProduct.category_id);
      expect(resBody.status).toEqual(testProduct.status);
      expect(resBody.price).toEqual(testProduct.price);
      expect(resBody.picture).toEqual(testProduct.picture);
      expect(resBody.ingredients).toEqual([
        {
          id: ingredient.id,
          name: ingredient.name,
          price: parseFloat(ingredient.price),
          value: ingredient.value,
        },
      ]);
      expect(Date.parse(resBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.updated_at)).not.toEqual(NaN);
    });

    test("With invalid id", async () => {
      const reqB = new RequestBuilder(`/api/v1/products/2`);

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(404);
      expect(resBody).toEqual({
        name: "NotFoundError",
        message: "O produto não foi encontrado no sistema.",
        action: 'Verifique se o "id" do produto está digitado corretamente.',
        status_code: 404,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
      });
      expect(uuidVersion(resBody.error_id)).toBe(4);
      expect(uuidVersion(resBody.request_id)).toBe(4);
    });
  });
});
