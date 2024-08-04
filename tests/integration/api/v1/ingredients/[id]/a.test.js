import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/ingredients/[id]", () => {
  describe("No user", () => {
    test("Retrieving information", async () => {
      const testProduct = await orchestrator.createIngredient();
      const reqB = new RequestBuilder(`/api/v1/ingredients/${testProduct.id}`);

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
      expect(uuidVersion(resBody.error_id)).toBe(4);
      expect(uuidVersion(resBody.request_id)).toBe(4);
    });
  });

  describe("Admin user", () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();
    });

    test("With valid id", async () => {
      const testIngredient = await orchestrator.createIngredient();
      const reqB = new RequestBuilder(
        `/api/v1/ingredients/${testIngredient.id}`,
      );
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(testIngredient.id);
      expect(resBody.name).toEqual(testIngredient.name);
      expect(resBody.value).toEqual(testIngredient.value);
      expect(resBody.status).toEqual(testIngredient.status);
      expect(resBody.price).toEqual(testIngredient.price);
      expect(Date.parse(resBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.updated_at)).not.toEqual(NaN);
    });

    test("With invalid id", async () => {
      const reqB = new RequestBuilder(`/api/v1/ingredients/2`);
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(404);
      expect(resBody).toEqual({
        name: "NotFoundError",
        message: "O ingrediente não foi encontrado no sistema.",
        action:
          'Verifique se o "id" do ingrediente está digitado corretamente.',
        status_code: 404,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
      });
      expect(uuidVersion(resBody.error_id)).toBe(4);
      expect(uuidVersion(resBody.request_id)).toBe(4);
    });
  });
});
