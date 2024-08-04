import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("POST to /api/v1/ingredients", () => {
  describe("No user", () => {
    test("With unique name and full valid data", async () => {
      const reqB = new RequestBuilder("/api/v1/ingredients");

      const values = {
        name: "Chocolate",
        value: 16,
        price: "1.49",
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

    test("With empty body", async () => {
      const reqB = new RequestBuilder("/api/v1/ingredients");
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.post({});

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

    test("With unique name and full valid data", async () => {
      const reqB = new RequestBuilder("/api/v1/ingredients");
      await reqB.buildAdmin();

      const values = {
        name: "Chocolate",
        value: 16,
        price: "1.49",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(201);
      expect(resBody.name).toEqual("Chocolate");
      expect(resBody.value).toBe(16);
      expect(resBody.price).toEqual("1.49");
      expect(Date.parse(resBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.updated_at)).not.toEqual(NaN);
    });

    test("With non-unique name and full valid data", async () => {
      const reqB = new RequestBuilder("/api/v1/ingredients");
      await reqB.buildAdmin();

      const testIngredient = await orchestrator.createIngredient();

      const values = {
        name: testIngredient.name,
        value: 16,
        price: "1.49",
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
          "MODEL:PRODUCT:CHECK_FOR_PRODUCT_UNIQUENESS:ALREADY_EXISTS",
        key: "name",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("With unique name only", async () => {
      const reqB = new RequestBuilder("/api/v1/ingredients");
      await reqB.buildAdmin();

      const values = {
        name: "Chocolate",
      };

      const { res, resBody } = await reqB.post(values);

      expect(res.status).toBe(201);
      expect(resBody.name).toEqual("Chocolate");
      expect(resBody.value).toEqual(null);
      expect(resBody.price).toEqual(null);
      expect(Date.parse(resBody.created_at)).not.toEqual(NaN);
      expect(Date.parse(resBody.updated_at)).not.toEqual(NaN);
    });

    test("With unique name but invalid value", async () => {
      const reqB = new RequestBuilder("/api/v1/ingredients");
      await reqB.buildAdmin();

      const values = {
        name: "Chocolate",
        value: "invalid",
      };

      const { res, resBody } = await reqB.post(values);

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
      const reqB = new RequestBuilder("/api/v1/ingredients");
      await reqB.buildAdmin();

      const values = {
        name: "Chocolate",
        price: "invalid",
      };

      const { res, resBody } = await reqB.post(values);

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
