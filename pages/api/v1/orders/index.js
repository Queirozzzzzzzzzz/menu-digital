import nextConnect from "next-connect";

import controller from "models/controller";
import validator from "models/validator";
import authorization from "models/authorization";
import authentication from "models/authentication";
import db from "infra/database";
import order from "models/order";

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(
    authentication.injectUser,
    getValidationHandler,
    authorization.canRequest("admin"),
    getHandler,
  );

async function getValidationHandler(req, res, next) {
  if (req.query.order_status)
    req.query.order_status = req.query.order_status.split(",");

  const cleanValues = validator(req.query, {
    order_status: "required",
  });

  req.body = cleanValues;

  next();
}

async function getHandler(req, res) {
  const orders = await order.listByStatus(req.query.order_status);

  return res.status(200).json(orders);
}
