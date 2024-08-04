import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import db from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to /api/v1/ingredients", () => {
  describe("No user", () => {
    test("With unique name and full valid data", async () => {
      const testingredient = await orchestrator.createIngredient();
      const reqB = new RequestBuilder(
        `/api/v1/ingredients/${testingredient.id}`,
      );

      const values = {
        name: "Chocolate",
        value: 16,
        price: "1.56",
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
      const testingredient = await orchestrator.createIngredient();
      const reqB = new RequestBuilder(
        `/api/v1/ingredients/${testingredient.id}`,
      );
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
      const testingredient = await orchestrator.createIngredient();
      const reqB = new RequestBuilder(
        `/api/v1/ingredients/${testingredient.id}`,
      );
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
      const testingredient = await orchestrator.createIngredient();
      const reqB = new RequestBuilder(
        `/api/v1/ingredients/${testingredient.id}`,
      );
      await reqB.buildAdmin();

      const values = {
        name: "Chocolate",
        value: 32,
        price: "156",
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.name).toEqual("Chocolate");
      expect(resBody.value).toEqual(32);
      expect(resBody.price).toEqual("156.00");
    });

    test("With non-unique name and full valid data", async () => {
      const testingredient = await orchestrator.createIngredient();
      const testingredient2 = await orchestrator.createIngredient();
      const reqB = new RequestBuilder(
        `/api/v1/ingredients/${testingredient.id}`,
      );
      await reqB.buildAdmin();

      const values = {
        name: testingredient2.name,
        value: 32,
        price: "156",
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
          "MODEL:INGREDIENT:CHECK_FOR_INGREDIENT_UNIQUENESS:ALREADY_EXISTS",
        key: "name",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With unique name but invalid value", async () => {
      const testingredient = await orchestrator.createIngredient();
      const reqB = new RequestBuilder(
        `/api/v1/ingredients/${testingredient.id}`,
      );
      await reqB.buildAdmin();

      const values = {
        name: "Chocolate",
        value: "invalid",
        price: "156",
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: '"value" deve ser do tipo Number.',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "value",
        type: "number.base",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With unique name but invalid price", async () => {
      const testingredient = await orchestrator.createIngredient();
      const reqB = new RequestBuilder(
        `/api/v1/ingredients/${testingredient.id}`,
      );
      await reqB.buildAdmin();

      const values = {
        name: "Chocolate",
        value: 48,
        price: "invalid",
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message: '"price" deve ser do tipo Number.',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "price",
        type: "number.base",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });
  });
});
