import nextConnect from "next-connect";

import controller from "models/controller";
import validator from "models/validator";
import category from "models/category";
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
    category_status: "required",
  });

  req.query = cleanQueryValues;
  req.body = cleanBodyValues;

  next();
}

async function patchHandler(req, res) {
  let newCategory;

  const transaction = await db.transaction();

  try {
    transaction.query("BEGIN");

    newCategory = await category.setStatus(
      req.query.id,
      req.body.category_status,
      {
        transaction,
      },
    );

    transaction.query("COMMIT");
  } catch (err) {
    await transaction.query("ROLLBACK");

    if (err.databaseErrorCode === db.errorCodes.UNIQUE_CONSTRAINT_VIOLATION) {
      throw new ValidationError({
        message: `O nome enviado parece ser duplicado.`,
        action: `Utilize um "nome" diferente.`,
        stack: new Error().stack,
        errorLocationCode:
          "MODEL:CATEGORY:CHECK_FOR_CATEGORY_UNIQUENESS:ALREADY_EXISTS",
        statusCode: 400,
        key: "name",
      });
    }

    if (err.databaseErrorCode === db.errorCodes.INVALID_FOREIGN_KEY) {
      throw new NotFoundError({
        message: `A categoria selecionado não foi encontrado.`,
        action: `Verifique a "category_id" utilizada e tente novamente.`,
        stack: new Error().stack,
        errorLocationCode: "MODEL:CATEGORY:CHECK_FOR_CATEGORY_ID:NOT_FOUND",
        key: "category_id",
      });
    }

    throw err;
  } finally {
    transaction.release();
  }

  return res.status(200).json(newCategory);
}
