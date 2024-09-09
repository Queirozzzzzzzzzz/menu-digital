import nextConnect from "next-connect";

import { ValidationError } from "errors";
import controller from "models/controller";
import validator from "models/validator";
import authorization from "models/authorization";
import authentication from "models/authentication";
import category from "models/category";
import db from "infra/database";

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
  )
  .post(
    authentication.injectUser,
    postValidationHandler,
    authorization.canRequest("admin"),
    postHandler,
  );

async function getValidationHandler(req, res, next) {
  if (req.query.category_status)
    req.query.category_status = req.query.category_status.split(",");

  const cleanValues = validator(req.query, {
    category_status: "required",
  });

  req.body = cleanValues;

  next();
}

async function getHandler(req, res) {
  const listedCategories = await category.listByStatus(
    req.query.category_status,
  );

  return res.status(200).json(listedCategories);
}

async function postValidationHandler(req, res, next) {
  const cleanValues = validator(req.body, {
    name: "required",
  });

  req.body = cleanValues;

  next();
}

async function postHandler(req, res) {
  let newCategory;

  const transaction = await db.transaction();

  try {
    transaction.query("BEGIN");

    newCategory = await category.create(req.body.name, { transaction });

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

    throw err;
  } finally {
    transaction.release();
  }

  return res.status(201).json(newCategory);
}
