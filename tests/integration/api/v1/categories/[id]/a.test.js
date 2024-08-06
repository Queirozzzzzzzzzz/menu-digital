import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import db from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to /api/v1/categories/[id]", () => {
  describe("No user", () => {
    test("Retrieving endpoint", async () => {
      const testCategory = await orchestrator.createCategory();
      const reqB = new RequestBuilder(`/api/v1/categories/${testCategory.id}`);

      const values = {
        category_status: ["disabled"],
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

    test('With valid category_status "disabled"', async () => {
      const testCategory = await orchestrator.createCategory();
      const reqB = new RequestBuilder(`/api/v1/categories/${testCategory.id}`);
      await reqB.buildAdmin();

      const values = {
        category_status: ["disabled"],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(testCategory.id);
      expect(resBody.status).toEqual("disabled");
      expect(Date.parse(resBody.created_at)).not.toBe(NaN);
      expect(Date.parse(resBody.updated_at)).not.toBe(NaN);
    });

    test('With valid category_status "available"', async () => {
      const testCategory = await orchestrator.createCategory();
      const reqB = new RequestBuilder(`/api/v1/categories/${testCategory.id}`);
      await reqB.buildAdmin();

      const values = {
        category_status: ["available"],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(testCategory.id);
      expect(resBody.status).toEqual("available");
      expect(Date.parse(resBody.created_at)).not.toBe(NaN);
      expect(Date.parse(resBody.updated_at)).not.toBe(NaN);
    });

    test("With invalid category_status", async () => {
      const testCategory = await orchestrator.createCategory();
      const reqB = new RequestBuilder(`/api/v1/categories/${testCategory.id}`);
      await reqB.buildAdmin();

      const values = {
        category_status: ["invalid"],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message:
          '"category_status[0]" deve possuir um dos seguintes valores: "available", "disabled".',
        action: "Ajuste os dados enviados e tente novamente.",
        status_code: 400,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
        error_location_code: "MODEL:VALIDATOR:FINAL_SCHEMA",
        key: "object",
        type: "any.only",
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });

    test("Without body", async () => {
      const testCategory = await orchestrator.createCategory();
      const reqB = new RequestBuilder(`/api/v1/categories/${testCategory.id}`);
      await reqB.buildAdmin();

      const values = {};

      const { res, resBody } = await reqB.patch(values);

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

    test("With invalid id", async () => {
      const reqB = new RequestBuilder(`/api/v1/categories/${2}`);
      await reqB.buildAdmin();

      const values = {
        category_status: ["disabled"],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(404);
      expect(resBody).toEqual({
        name: "NotFoundError",
        message: "A categoria não foi encontrada no sistema.",
        action: 'Verifique se o "id" da categoria está digitado corretamente.',
        status_code: 404,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    });
  });
});
