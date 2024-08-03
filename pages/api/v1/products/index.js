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
  .post(
    authentication.injectUser,
    postValidationHandler,
    authorization.canRequest("admin"),
    postHandler,
  )
  .get(getValidationHandler, getHandler);

async function postValidationHandler(req, res, next) {
  const cleanValues = validator(req.body, {
    ingredients_ids: "optional",
    product_name: "required",
    product_category: "required",
    price: "required",
    picture: "required",
  });

  req.body = cleanValues;

  next();
}

async function postHandler(req, res) {
  let newProduct;

  const transaction = await db.transaction();

  try {
    transaction.query("BEGIN");

    newProduct = await product.create(req.body, { transaction });

    transaction.query("COMMIT");
  } catch (err) {
    await transaction.query("ROLLBACK");

    if (err.databaseErrorCode === db.errorCodes.UNIQUE_CONSTRAINT_VIOLATION) {
      throw new ValidationError({
        message: `O conteúdo enviado parece ser duplicado.`,
        action: `Utilize um "title" ou "slug" com começo diferente.`,
        stack: new Error().stack,
        errorLocationCode:
          "MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS",
        statusCode: 400,
        key: "slug",
      });
    }

    throw err;
  } finally {
    transaction.release();
  }

  return res.status(201).json(newProduct);
}

async function getValidationHandler(req, res, next) {
  if (req.query.product_status)
    req.query.product_status = req.query.product_status.split(",");

  const cleanValues = validator(req.query, {
    product_status: "required",
  });

  req.body = cleanValues;

  next();
}

async function getHandler(req, res) {
  const products = await product.listByStatus(req.query.product_status);

  return res.status(200).json(products);
}
