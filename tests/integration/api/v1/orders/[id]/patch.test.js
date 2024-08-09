import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import db from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("PATCH to /api/v1/orders/[id]", () => {
  describe("No user", () => {
    test("Retrieving endpoint", async () => {
      const testProduct = await orchestrator.createProduct();
      const testOrder = await orchestrator.createOrder({
        product_id: testProduct.id,
      });
      const reqB = new RequestBuilder(`/api/v1/orders/${testOrder.id}`);

      const values = {
        order_status: ["accepted"],
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

    test('With valid order_status "accepted"', async () => {
      const testProduct = await orchestrator.createProduct();
      const testOrder = await orchestrator.createOrder({
        product_id: testProduct.id,
      });
      const reqB = new RequestBuilder(`/api/v1/orders/${testOrder.id}`);
      await reqB.buildAdmin();

      const values = {
        order_status: ["accepted"],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(testOrder.id);
      expect(resBody.product_id).toEqual(testOrder.product_id);
      expect(resBody.price).toEqual(testOrder.price);
      expect(resBody.table_number).toEqual(testOrder.table_number);
      expect(resBody.observation).toEqual(testOrder.observation);
      expect(resBody.status).toEqual("accepted");
      expect(Date.parse(resBody.created_at)).not.toBe(NaN);
      expect(Date.parse(resBody.updated_at)).not.toBe(NaN);
    });
    /* 
    test('With valid order_status "declined"', async () => {
      const testProduct = await orchestrator.createProduct();
      const testOrder = await orchestrator.createOrder({
        product_id: testProduct.id,
      });
      const reqB = new RequestBuilder(`/api/v1/orders/${testOrder.id}`);
      await reqB.buildAdmin();

      const values = {
        order_status: ["declined"],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(testOrder.id);
      expect(resBody.product_id).toEqual(testOrder.product_id);
      expect(resBody.price).toEqual(testOrder.price);
      expect(resBody.table_number).toEqual(testOrder.table_number);
      expect(resBody.observation).toEqual(testOrder.observation);
      expect(resBody.status).toEqual("declined");
      expect(Date.parse(resBody.created_at)).not.toBe(NaN);
      expect(Date.parse(resBody.updated_at)).not.toBe(NaN);
    });

    test('With valid order_status "finished"', async () => {
      const testProduct = await orchestrator.createProduct();
      const testOrder = await orchestrator.createOrder({
        product_id: testProduct.id,
      });
      const reqB = new RequestBuilder(`/api/v1/orders/${testOrder.id}`);
      await reqB.buildAdmin();

      const values = {
        order_status: ["finished"],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(testOrder.id);
      expect(resBody.product_id).toEqual(testOrder.product_id);
      expect(resBody.price).toEqual(testOrder.price);
      expect(resBody.table_number).toEqual(testOrder.table_number);
      expect(resBody.observation).toEqual(testOrder.observation);
      expect(resBody.status).toEqual("finished");
      expect(Date.parse(resBody.created_at)).not.toBe(NaN);
      expect(Date.parse(resBody.updated_at)).not.toBe(NaN);
    });

    test("With invalid order_status", async () => {
      const testProduct = await orchestrator.createProduct();
      const testOrder = await orchestrator.createOrder({
        product_id: testProduct.id,
      });
      const reqB = new RequestBuilder(`/api/v1/orders/${testOrder.id}`);
      await reqB.buildAdmin();

      const values = {
        order_status: ["invalid"],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(400);
      expect(resBody).toEqual({
        name: "ValidationError",
        message:
          '"order_status[0]" deve possuir um dos seguintes valores: "pending", "accepted", "declined", "finished".',
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
      const testProduct = await orchestrator.createProduct();
      const testOrder = await orchestrator.createOrder({
        product_id: testProduct.id,
      });
      const reqB = new RequestBuilder(`/api/v1/orders/${testOrder.id}`);
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
      const reqB = new RequestBuilder(`/api/v1/orders/${2}`);
      await reqB.buildAdmin();

      const values = {
        order_status: ["accepted"],
      };

      const { res, resBody } = await reqB.patch(values);

      expect(res.status).toBe(404);
      expect(resBody).toEqual({
        name: "NotFoundError",
        message: "O pedido não foi encontrado no sistema.",
        action: 'Verifique se o "id" do pedido está digitado corretamente.',
        status_code: 404,
        error_id: resBody.error_id,
        request_id: resBody.request_id,
      });
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);
    }); */
  });
});
