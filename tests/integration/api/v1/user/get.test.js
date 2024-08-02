import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("No user", () => {
    test("Retrieving the endpoint", async () => {
      const res = await fetch(`${orchestrator.webserverUrl}/api/v1/user`);

      const resBody = await res.json();

      expect(res.status).toEqual(401);
      expect(resBody.name).toEqual("UnauthorizedError");
      expect(resBody.message).toEqual("Usuário não autenticado.");
      expect(resBody.action).toEqual(
        `Verifique se você está autenticado com uma sessão ativa e tente novamente.`,
      );
      expect(resBody.status_code).toEqual(401);
      expect(uuidVersion(resBody.error_id)).toEqual(4);
      expect(uuidVersion(resBody.request_id)).toEqual(4);

      const parsedCookies = orchestrator.parseSetCookies(res);
      expect(parsedCookies).toEqual({});
    });
  });

  describe("Admin user", () => {
    test("With valid session", async () => {
      const reqB = new RequestBuilder("/api/v1/user");
      const adminUser = await reqB.buildAdmin();

      const { res, resBody } = await reqB.get();

      expect(res.status).toBe(200);
      expect(resBody.id).toEqual(adminUser.id);
      expect(resBody.tag).toEqual(adminUser.tag);
      expect(resBody.username).toEqual(adminUser.username);
      expect(resBody.email).toEqual(adminUser.email);
      expect(resBody.features).toEqual(adminUser.features);
      expect(new Date(resBody.created_at)).toEqual(
        new Date(adminUser.created_at),
      );

      const parsedCookies = orchestrator.parseSetCookies(res);
      expect(parsedCookies).toEqual({});
    });
  });
});
