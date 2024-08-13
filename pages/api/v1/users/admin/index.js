import nextConnect from "next-connect";

import controller from "models/controller";
import validator from "models/validator";
import user from "models/user";
import authentication from "models/authentication";
import authorization from "models/authorization";

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .post(postValidationHandler, postHandler)
  .delete(
    deleteValidationHandler,
    authentication.injectUser,
    authorization.canRequest("admin"),
    deleteHandler,
  );

async function postValidationHandler(req, res, next) {
  const values = {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    features: ["admin"]
  };

  const cleanValues = validator(values, {
    features: "optional",
    username: "required",
    password: "required",
  });

  req.body = cleanValues;

  next();
}

async function postHandler(req, res) {
  const newUser = await user.create(req.body);

  return res.status(201).json(newUser);
}

async function deleteValidationHandler(req, res, next) {
  const cleanValues = validator(req.body, {
    username: "required",
  });

  req.body = cleanValues;

  next();
}

async function deleteHandler(req, res) {
  const deletedUser = await user.remove(req.body.username);

  return res.status(200).json(deletedUser);
}
