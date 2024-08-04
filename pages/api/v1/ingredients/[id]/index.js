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
  .patch(
    authentication.injectUser,
    patchValidationHandler,
    authorization.canRequest("admin"),
    patchHandler,
  )
  .get(
    authentication.injectUser,
    getValidationHandler,
    authorization.canRequest("admin"),
    getHandler,
  );

async function patchValidationHandler(req, res, next) {
  const cleanValues = validator(req.body, {
    name: "optional",
    value: "optional",
    price: "optional",
  });

  req.body = cleanValues;

  next();
}

async function patchHandler(req, res) {
  let newIngredient;

  const transaction = await db.transaction();

  try {
    transaction.query("BEGIN");

    newIngredient = await ingredient.edit(req.query.id, req.body, {
      transaction,
    });

    transaction.query("COMMIT");
  } catch (err) {
    await transaction.query("ROLLBACK");

    if (err.databaseErrorCode === db.errorCodes.UNIQUE_CONSTRAINT_VIOLATION) {
      throw new ValidationError({
        message: `O nome enviado parece ser duplicado.`,
        action: `Utilize um "nome" diferente.`,
        stack: new Error().stack,
        errorLocationCode:
          "MODEL:INGREDIENT:CHECK_FOR_INGREDIENT_UNIQUENESS:ALREADY_EXISTS",
        statusCode: 400,
        key: "name",
      });
    }

    throw err;
  } finally {
    transaction.release();
  }

  return res.status(200).json(newIngredient);
}

async function getValidationHandler(req, res, next) {
  const cleanValues = validator(req.query, {
    id: "required",
  });

  req.query = cleanValues;

  next();
}

async function getHandler(req, res) {
  const ingredients = await ingredient.findById(req.query.id);

  return res.status(200).json(ingredients);
}
