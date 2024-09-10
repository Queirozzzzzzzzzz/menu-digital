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
  .patch(
    authentication.injectUser,
    patchValidationHandler,
    authorization.canRequest("admin"),
    patchHandler,
  )
  .get(getValidationHandler, getHandler);

async function patchValidationHandler(req, res, next) {
  const cleanValues = validator(req.body, {
    ingredients_ids: "optional",
    name: "optional",
    category: "optional",
    price: "optional",
    picture: "optional",
    product_status: "optional",
  });

  req.body = cleanValues;

  next();
}

async function patchHandler(req, res) {
  let newProduct;

  const transaction = await db.transaction();

  try {
    transaction.query("BEGIN");

    newProduct = await product.edit(req.query.id, req.body, { transaction });

    transaction.query("COMMIT");
  } catch (err) {
    await transaction.query("ROLLBACK");

    if (err.databaseErrorCode === db.errorCodes.UNIQUE_CONSTRAINT_VIOLATION) {
      throw new ValidationError({
        message: `O nome enviado parece ser duplicado.`,
        action: `Utilize um "nome" diferente.`,
        stack: new Error().stack,
        errorLocationCode:
          "MODEL:PRODUCT:CHECK_FOR_PRODUCT_UNIQUENESS:ALREADY_EXISTS",
        statusCode: 400,
        key: "name",
      });
    }

    throw err;
  } finally {
    transaction.release();
  }

  return res.status(200).json(newProduct);
}

async function getValidationHandler(req, res, next) {
  const cleanValues = validator(req.query, {
    id: "required",
  });

  req.query = cleanValues;

  next();
}

async function getHandler(req, res) {
  const products = await product.findById(req.query.id);

  return res.status(200).json(products);
}
