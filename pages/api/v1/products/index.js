import nextConnect from "next-connect";

import controller from "models/controller";
import validator from "models/validator";
import product from "models/product";
import authorization from "models/authorization";
import authentication from "models/authentication";

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
  );

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
  const newProduct = await product.create(req.body);

  return res.status(201).json(newProduct);
}
