import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import db from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/orders", () => {
  describe("No user", () => {
    test("Retrieving endpoint", async () => {
      const reqB = new RequestBuilder(`/api/v1/orders?order_status=pending`);

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
    });
  });

  describe("Admin user", () => {
    beforeEach(async () => {
      await orchestrator.dropAllTables();
      await orchestrator.runPendingMigrations();

      const product = await orchestrator.createProduct();
      const statuses = ["pending", "accepted", "declined", "finished"];
      await Promise.all(
        statuses.map((status) =>
          orchestrator.createOrder({
            status,
            product_id: product.id,
          }),
        ),
      );

      const ordersInDb = await db.query("SELECT * FROM orders;");
      expect(ordersInDb.rows.length).toBe(4);
    });

    test("With 1 valid order_status array", async () => {
      const reqB = new RequestBuilder(`/api/v1/orders?order_status=pending`);
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(1);
    });

    test("With 2 valid order_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/orders?order_status=pending,accepted`,
      );
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(2);
    });

    test("With 3 valid order_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/orders?order_status=pending,accepted,declined`,
      );
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(3);
    });

    test("With 4 valid order_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/orders?order_status=pending,accepted,declined,finished`,
      );
      await reqB.buildAdmin();

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(4);
    });

    test("With an invalid order_status array", async () => {
      const reqB = new RequestBuilder(`/api/v1/orders?order_status=invalid`);

      const { res, resBody } = await reqB.get();
      await reqB.buildAdmin();

      expect(res.status).toBe(400);
      expect(resBody.name).toEqual("ValidationError");
      expect(resBody.message).toEqual(
        '"order_status[0]" deve possuir um dos seguintes valores: "pending", "accepted", "declined", "finished".',
      );
      expect(resBody.action).toEqual(
        "Ajuste os dados enviados e tente novamente.",
      );
      expect(resBody.status_code).toEqual(400);
      expect(uuidVersion(resBody.error_id)).toBe(4);
      expect(uuidVersion(resBody.request_id)).toBe(4);
      expect(resBody.error_location_code).toEqual(
        "MODEL:VALIDATOR:FINAL_SCHEMA",
      );
      expect(resBody.key).toEqual("object");
      expect(resBody.type).toEqual("any.only");
    });

    test("With a blank order_status array", async () => {
      const reqB = new RequestBuilder(`/api/v1/orders`);

      const { res, resBody } = await reqB.get();
      await reqB.buildAdmin();

      expect(res.status).toBe(400);
      expect(resBody.name).toEqual("ValidationError");
      expect(resBody.message).toEqual(
        "Objeto enviado deve ter no mínimo uma chave.",
      );
      expect(resBody.action).toEqual(
        "Ajuste os dados enviados e tente novamente.",
      );
      expect(resBody.status_code).toEqual(400);
      expect(uuidVersion(resBody.error_id)).toBe(4);
      expect(uuidVersion(resBody.request_id)).toBe(4);
      expect(resBody.error_location_code).toEqual(
        "MODEL:VALIDATOR:FINAL_SCHEMA",
      );
      expect(resBody.key).toEqual("object");
      expect(resBody.type).toEqual("object.min");
    });
  });
});
