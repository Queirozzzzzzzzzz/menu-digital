import nextConnect from "next-connect";

import { NotFoundError, ValidationError } from "errors";
import controller from "models/controller";
import validator from "models/validator";
import authorization from "models/authorization";
import authentication from "models/authentication";
import order from "models/order";
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
  .post(postValidationHandler, postHandler);

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

async function postValidationHandler(req, res, next) {
  const cleanValues = validator(req.body, {
    order_id: "required",
    product_id: "required",
    price: "required",
    table_number: "required",
    observation: "optional",
    additional_ingredients: "optional",
    removed_ingredients: "optional",
  });

  req.body = cleanValues;

  next();
}

async function postHandler(req, res) {
  let createdOrder;

  const transaction = await db.transaction();

  try {
    transaction.query("BEGIN");

    const newOrder = await order.create(req.body, { transaction });
    await order.setIngredients(newOrder.id, req.body, { transaction });
    createdOrder = await order.findById(newOrder.id, { transaction });

    transaction.query("COMMIT");
  } catch (err) {
    await transaction.query("ROLLBACK");

    if (err.databaseErrorCode === db.errorCodes.UNIQUE_CONSTRAINT_VIOLATION) {
      throw new ValidationError({
        message: `O nome enviado parece ser duplicado.`,
        action: `Utilize um "nome" diferente.`,
        stack: new Error().stack,
        errorLocationCode:
          "MODEL:ORDER:CHECK_FOR_ORDER_UNIQUENESS:ALREADY_EXISTS",
        statusCode: 400,
        key: "name",
      });
    }

    if (
      err.message ===
      'insert or update on table "additional_ingredients" violates foreign key constraint "additional_ingredients_ingredient_id_fkey"' || err.message === 'inserção ou atualização em tabela "additional_ingredients" viola restrição de chave estrangeira "additional_ingredients_ingredient_id_fkey"'
    ) {
      throw new NotFoundError({
        message: `O ingrediente selecionado não foi encontrado.`,
        action: `Verifique o "ingredient_id" utilizado e tente novamente.`,
        stack: new Error().stack,
        errorLocationCode:
          "MODEL:ORDER:CHECK_FOR_ORDER_INGREDIENT_ID:NOT_FOUND",
        key: "ingredient_id",
      });
    }

    if (
      err.message ===
      'insert or update on table "removed_ingredients" violates foreign key constraint "removed_ingredients_ingredient_id_fkey"' || err.message === 'inserção ou atualização em tabela "removed_ingredients" viola restrição de chave estrangeira "removed_ingredients_ingredient_id_fkey"'
    ) {
      throw new NotFoundError({
        message: `O ingrediente selecionado não foi encontrado.`,
        action: `Verifique o "ingredient_id" utilizado e tente novamente.`,
        stack: new Error().stack,
        errorLocationCode:
          "MODEL:ORDER:CHECK_FOR_ORDER_INGREDIENT_ID:NOT_FOUND",
        key: "ingredient_id",
      });
    }

    if (err.databaseErrorCode === db.errorCodes.INVALID_FOREIGN_KEY) {
      throw new NotFoundError({
        message: `O produto selecionado não foi encontrado.`,
        action: `Verifique o "product_id" utilizado e tente novamente.`,
        stack: new Error().stack,
        errorLocationCode: "MODEL:ORDER:CHECK_FOR_ORDER_PRODUCT_ID:NOT_FOUND",
        key: "product_id",
      });
    }

    throw err;
  } finally {
    transaction.release();
  }

  return res.status(201).json(createdOrder);
}
