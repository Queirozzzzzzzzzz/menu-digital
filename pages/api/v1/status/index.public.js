import nextConnect from "next-connect";

import db from "infra/database";
import controller from "models/controller";

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(getHandler);

async function getHandler(req, res) {
  const updatedAt = new Date().toISOString();

  const dbName = process.env.POSTGRES_DB;
  const dbVersionRes = await db.query("SHOW server_version;");
  const dbMaxConnectionsRes = await db.query("SHOW max_connections;");
  const dbOpenedConnectionsRes = await db.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [dbName],
  });

  return res.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: dbVersionRes.rows[0].server_version,
        max_connections: parseInt(dbMaxConnectionsRes.rows[0].max_connections),
        opened_connections: dbOpenedConnectionsRes.rows[0].count,
      },
    },
  });
}
