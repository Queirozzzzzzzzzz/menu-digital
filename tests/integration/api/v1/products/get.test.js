import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import db from "infra/database";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET to /api/v1/products", () => {
  describe("No user", () => {
    test("With 1 valid product_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/products?product_status=available`,
      );

      const statuses = ["available", "missing", "disabled"];
      await Promise.all(
        statuses.map((status) => orchestrator.createProduct({ status })),
      );

      const productsInDb = await db.query("SELECT * FROM products;");
      expect(productsInDb.rows.length).toBe(3);

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(1);
    });

    test("With 2 valid product_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/products?product_status=available,missing`,
      );

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(2);
    });

    test("With 3 valid product_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/products?product_status=available,missing,disabled`,
      );

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.length).toBe(3);
    });

    test("With an invalid product_status array", async () => {
      const reqB = new RequestBuilder(
        `/api/v1/products?product_status=invalid`,
      );

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(400);
      expect(resBody.name).toEqual("ValidationError");
      expect(resBody.message).toEqual(
        '"product_status[0]" deve possuir um dos seguintes valores: "available", "missing", "disabled".',
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

    test("With a blank product_status array", async () => {
      const reqB = new RequestBuilder(`/api/v1/products`);

      const { res, resBody } = await reqB.get();

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
