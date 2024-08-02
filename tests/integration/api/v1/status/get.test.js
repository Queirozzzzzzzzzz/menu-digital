import orchestrator from "tests/orchestrator";
import RequestBuilder from "tests/request-builder";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
});

describe("GET to /api/v1/status", () => {
  test("Retrieving current system status", async () => {
    const requestBuilder = new RequestBuilder("/api/v1/status");

    const { res, resBody } = await requestBuilder.get();

    expect(res.status).toBe(200);

    const parsedUpdatedAt = new Date(resBody.updated_at).toISOString();
    expect(resBody.updated_at).toEqual(parsedUpdatedAt);

    expect(resBody.dependencies.database.version).toEqual("16.0");
    expect(resBody.dependencies.database.max_connections).toEqual(100);
    expect(resBody.dependencies.database.opened_connections).toBeGreaterThan(0);
  });
});
