import nextConnect from "next-connect";

import { UnauthorizedError } from "errors";
import controller from "models/controller";
import validator from "models/validator";
import user from "models/user";
import authentication from "models/authentication";

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .post(postValidationHandler, postHandler)
  .delete(deleteHandler);

async function postValidationHandler(req, res, next) {
  const cleanValues = validator(req.body, {
    username: "required",
    password: "required",
  });

  req.body = cleanValues;

  next();
}

async function postHandler(req, res) {
  const storedUser = await user.findByUsername(req.body.username);

  try {
    await authentication.comparePasswords(
      req.body.password,
      storedUser.password,
    );
  } catch (err) {
    throw new UnauthorizedError({
      message: `Dados não conferem.`,
      action: `Verifique se os dados enviados estão corretos.`,
      errorLocationCode: `CONTROLLER:SESSIONS:POST_HANDLER:DATA_MISMATCH`,
    });
  }

  const sessionObj = await authentication.createSessionAndSetCookies(
    storedUser.id,
    res,
  );

  return res.status(201).json(sessionObj);
}

async function deleteHandler(req, res) {
  const authenticatedUser = req.context.user;
  const sessionObj = req.context.session;

  const expiredSession = await session.expireById(sessionObj.id);
  session.clearSessionCookie(res);

  return res.status(200).json(expiredSession);
}
