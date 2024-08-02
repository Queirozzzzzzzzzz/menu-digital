import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
});

describe("POST to /api/v1/status", () => {
  test("Retrieving current system status", async () => {
    const requestBuilder = new RequestBuilder("/api/v1/status");

    const { res, resBody } = await requestBuilder.post();

    expect(res.status).toBe(405);
    expect(resBody.name).toEqual("MethodNotAllowedError");
    expect(resBody.message).toEqual(
      'Método "POST" não permitido para "/api/v1/status".',
    );
    expect(resBody.action).toEqual(
      "Utilize um método HTTP válido para este recurso.",
    );
    expect(resBody.status_code).toBe(405);
    expect(uuidVersion(resBody.error_id)).toEqual(4);
    expect(uuidVersion(resBody.request_id)).toEqual(4);
  });
});
