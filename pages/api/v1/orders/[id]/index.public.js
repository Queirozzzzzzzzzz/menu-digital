import nextConnect from "next-connect";

import controller from "models/controller";
import validator from "models/validator";
import order from "models/order";
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
  .patch(
    authentication.injectUser,
    patchValidationHandler,
    authorization.canRequest("admin"),
    patchHandler,
  );

async function patchValidationHandler(req, res, next) {
  const cleanQueryValues = validator(req.query, {
    id: "required",
  });

  const cleanBodyValues = validator(req.body, {
    order_status: "required",
  });

  req.query = cleanQueryValues;
  req.body = cleanBodyValues;

  next();
}

async function patchHandler(req, res) {
  let newOrder;

  const transaction = await db.transaction();

  try {
    transaction.query("BEGIN");

    newOrder = await order.setStatus(req.query.id, req.body.order_status, {
      transaction,
    });

    transaction.query("COMMIT");
  } catch (err) {
    await transaction.query("ROLLBACK");

    if (err.databaseErrorCode === db.errorCodes.INVALID_FOREIGN_KEY) {
      throw new NotFoundError({
        message: `O pedido selecionado não foi encontrado.`,
        action: `Verifique a "order_id" utilizada e tente novamente.`,
        stack: new Error().stack,
        errorLocationCode: "MODEL:order:CHECK_FOR_order_ID:NOT_FOUND",
        key: "order_id",
      });
    }

    throw err;
  } finally {
    transaction.release();
  }

  return res.status(200).json(newOrder);
}
