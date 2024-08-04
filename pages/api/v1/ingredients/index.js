import nextConnect from "next-connect";

import { ValidationError } from "errors";
import controller from "models/controller";
import validator from "models/validator";
import authorization from "models/authorization";
import authentication from "models/authentication";
import db from "infra/database";
import ingredient from "models/ingredient";

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .get(authentication.injectUser, authorization.canRequest("admin"), getHandler)
  .post(
    authentication.injectUser,
    postValidationHandler,
    authorization.canRequest("admin"),
    postHandler,
  );

async function getHandler(req, res) {
  const ingredients = await ingredient.list();

  return res.status(200).json(ingredients);
}

async function postValidationHandler(req, res, next) {
  const cleanValues = validator(req.body, {
    ingredients_ids: "optional",
    name: "required",
    category: "required",
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
        action: `Utilize um "nome" diferente.`,
        stack: new Error().stack,
        errorLocationCode:
          "MODEL:CONTENT:CHECK_FOR_CONTENT_UNIQUENESS:ALREADY_EXISTS",
        statusCode: 400,
        key: "name",
      });
    }

    throw err;
  } finally {
    transaction.release();
  }

  return res.status(201).json(newProduct);
}
