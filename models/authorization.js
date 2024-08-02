import { ForbiddenError } from "errors";

function canRequest(feature) {
  return function (req, res, next) {
    const reqUser = req.context.user;

    if (!reqUser) {
      throw new ForbiddenError({
        message: `Usuário não encontrado.`,
        action: `Verifique se o usuário está logado.`,
        errorLocationCode: "MODEL:AUTHORIZATION:CAN_REQUEST:USER_NOT_FOUND",
      });
    }

    if (!reqUser.features.includes(feature)) {
      throw new ForbiddenError({
        message: `Usuário não pode executar esta operação.`,
        action: `Verifique se este usuário possui a feature "${feature}".`,
        errorLocationCode: "MODEL:AUTHORIZATION:CAN_REQUEST:FEATURE_NOT_FOUND",
      });
    }

    next();
  };
}

export default {
  canRequest,
};
