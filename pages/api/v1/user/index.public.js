import nextConnect from "next-connect";

import session from "models/session";
import authentication from "models/authentication";
import controller from "models/controller";
import { UnauthorizedError } from "errors";

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(authentication.injectUser)
  .use(controller.logRequest)
  .get(renewSessionIfNecessary, getHandler);

async function getHandler(req, res) {
  const authenticatedUser = req.context.user;

  return res.status(200).json(authenticatedUser);
}

async function renewSessionIfNecessary(req, res, next) {
  let sessionObj = req.context.session;

  if (sessionObj === undefined) throw new UnauthorizedError({});

  // <3 weeks
  if (
    new Date(sessionObj?.expires_at) <
    Date.now() + 1000 * 60 * 60 * 24 * 7 * 3
  ) {
    sessionObj = await session.renew(sessionObj.id, res);

    req.context.session = sessionObj;
  }

  return next();
}
