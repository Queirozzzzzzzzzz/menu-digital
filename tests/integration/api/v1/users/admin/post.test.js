import orchestrator from "tests/orchestrator.js";
import RequestBuilder from "tests/request-builder";
import password from "models/password";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.dropAllTables();
  await orchestrator.runPendingMigrations();
});

describe("POST to /api/v1/users/admin", () => {
  describe("No user", () => {
    test("Action", async () => {
      const reqB = new RequestBuilder("/api/v1/users/admin");

      const { res, resBody } = await reqB.post();

      expect(res.status).toBe(201);
      expect(resBody.username).toEqual(process.env.ADMIN_USERNAME);
      const validPasswordsMatch = await password.compare(
        process.env.ADMIN_PASSWORD,
        resBody.password,
      );
      expect(validPasswordsMatch).toBe(true);
      expect(resBody.features).toEqual(["admin"]);
    });
  });
});
