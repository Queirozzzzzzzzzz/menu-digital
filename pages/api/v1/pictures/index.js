import nextConnect from "next-connect";

import controller from "models/controller";
import validator from "models/validator";
import product from "models/product";
import authorization from "models/authorization";
import authentication from "models/authentication";
import db from "infra/database";
import { ValidationError } from "errors";

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(
    authentication.injectUser,
    authorization.canRequest("admin"),
    getHandler,
  );

async function getHandler(req, res) {
  return res.status(200).json(process.env.IMGBB_API_KEY);
}
