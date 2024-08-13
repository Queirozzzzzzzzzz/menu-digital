import Joi from "joi";

import { ValidationError } from "errors";

const MAX_INTEGER = 2147483647;
const MIN_INTEGER = -2147483648;

const cachedSchemas = {};

const defaultSchema = Joi.object()
  .label("body")
  .required()
  .min(1)
  .messages({
    "any.invalid": '{#label} possui o valor inválido "{#value}".',
    "any.only": "{#label} deve possuir um dos seguintes valores: {#valids}.",
    "any.required": "{#label} é um campo obrigatório.",
    "array.base": "{#label} deve ser do tipo Array.",
    "boolean.base": "{#label} deve ser do tipo Boolean.",
    "date.base": "{#label} deve conter uma data válida.",
    "markdown.empty": "Markdown deve conter algum texto.",
    "number.base": "{#label} deve ser do tipo Number.",
    "number.integer": "{#label} deve ser um Inteiro.",
    "number.max": "{#label} deve possuir um valor máximo de {#limit}.",
    "number.min": "{#label} deve possuir um valor mínimo de {#limit}.",
    "number.unsafe": `{#label} deve possuir um valor entre ${MIN_INTEGER} e ${MAX_INTEGER}.`,
    "number.precision":
      "{#label} deve ter precisão de {#limit} dígitos após a vírgula.",
    "object.base": "{#label} enviado deve ser do tipo Object.",
    "object.min": "Objeto enviado deve ter no mínimo uma chave.",
    "string.alphanum": "{#label} deve conter apenas caracteres alfanuméricos.",
    "string.base": "{#label} deve ser do tipo String.",
    "string.email": "{#label} deve conter um email válido.",
    "string.empty": "{#label} não pode estar em branco.",
    "string.length":
      '{#label} deve possuir {#limit} {if(#limit==1, "caractere", "caracteres")}.',
    "string.ip": "{#label} deve possuir um IP válido.",
    "string.guid": "{#label} deve possuir um token UUID na versão 4.",
    "string.max":
      '{#label} deve conter no máximo {#limit} {if(#limit==1, "caractere", "caracteres")}.',
    "string.min":
      '{#label} deve conter no mínimo {#limit} {if(#limit==1, "caractere", "caracteres")}.',
    "tag.reserved": "Esta tag de usuário não está disponível para uso.",
    "username.reserved": "Este nome de usuário não está disponível para uso.",
    "string.pattern.base": "{#label} está no formato errado.",
    "string.uri": "{#label} deve ser uma URI válida.",
    "array.base": "{#label} deve ser um array com base válida.",
  });

export default function validator(obj, keys) {
  try {
    obj = JSON.parse(JSON.stringify(obj));
  } catch (err) {
    throw new ValidationError({
      message: "Não foi possível interpretar o valor enviado.",
      action: "Verifique se o valor enviado é um JSON válido.",
      errorLocationCode: "MODEL:VALIDATOR:ERROR_PARSING_JSON",
      stack: new Error().stack,
      key: "object",
    });
  }

  const keysString = Object.keys(keys).join(",");

  if (!cachedSchemas[keysString]) {
    let finalSchema = defaultSchema;

    for (const key of Object.keys(keys)) {
      const keyValidationFunction = schemas[key];
      finalSchema = finalSchema.concat(keyValidationFunction());
    }
    cachedSchemas[keysString] = finalSchema;
  }

  const { error: err, value } = cachedSchemas[keysString].validate(obj, {
    stripUnknown: true,
    context: {
      required: keys,
    },
    errors: {
      escapeHtml: true,
      wrap: {
        array: false,
        string: '"',
      },
    },
  });

  if (err) {
    throw new ValidationError({
      message: err.details[0].message,
      key:
        err.details[0].context.key || err.details[0].context.type || "object",
      errorLocationCode: "MODEL:VALIDATOR:FINAL_SCHEMA",
      stack: new Error().stack,
      type: err.details[0].type,
    });
  }

  return value;
}

const schemas = {
  username: function () {
    return Joi.object({
      username: Joi.string()
        .pattern(/^[a-zA-Z0-9\u00C0-\u017F ]+$/)
        .min(1)
        .max(30)
        .trim()
        .when("$required.username", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
    });
  },

  password: function () {
    return Joi.object({
      password: Joi.string().min(8).max(72).trim().when("$required.password", {
        is: "required",
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  session_id: function () {
    return Joi.object({
      session_id: Joi.string()
        .length(96)
        .alphanum()
        .when("$required.session_id", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
    });
  },

  name: function () {
    return Joi.object({
      name: Joi.string()
        .pattern(
          /^(\s|\p{C}|\u2800|\u034f|\u115f|\u1160|\u17b4|\u17b5|\u3164|\uffa0).*$/su,
          { invert: true },
        )
        .replace(
          /(\s|\p{C}|\u2800|\u034f|\u115f|\u1160|\u17b4|\u17b5|\u3164|\uffa0)+$|\u0000/gsu,
          "",
        )
        .min(1)
        .max(128)
        .when("$required.name", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        })
        .messages({
          "string.pattern.invert.base": `{#label} deve começar com caracteres visíveis.`,
        }),
    });
  },

  category_id: function () {
    return Joi.object({
      category_id: Joi.number().integer().when("$required.category_id", {
        is: "required",
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  category_status: function () {
    return Joi.object({
      category_status: Joi.array().items(
        Joi.string()
          .valid("available", "disabled")
          .min(0)
          .when("$required.category_status", {
            is: "required",
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
      ),
    });
  },

  features: function () {
    return Joi.object({
      features: Joi.array().items(
        Joi.string()
          .valid("admin")
          .min(0)
          .when("$required.features", {
            is: "required",
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
      ),
    });
  },

  price: function () {
    return Joi.object({
      price: Joi.number()
        .precision(10, 2)
        .min(0)
        .max(99999999.99)
        .when("$required.price", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
    });
  },

  value: function () {
    return Joi.object({
      value: Joi.number().integer().when("$required.value", {
        is: "required",
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  picture: function () {
    return Joi.object({
      picture: Joi.string()
        .uri({ scheme: ["http", "https"] })
        .when("$required.picture", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
    });
  },

  ingredients_ids: function () {
    return Joi.object({
      ingredients_ids: Joi.array()
        .items(Joi.number().integer().positive())
        .min(0)
        .when("$required.ingredients_ids", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
    });
  },

  product_status: function () {
    return Joi.object({
      product_status: Joi.array().items(
        Joi.string()
          .valid("available", "missing", "disabled")
          .min(0)
          .when("$required.product_status", {
            is: "required",
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
      ),
    });
  },

  id: function () {
    return Joi.object({
      id: Joi.number().integer().when("$required.id", {
        is: "required",
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  order_status: function () {
    return Joi.object({
      order_status: Joi.array().items(
        Joi.string()
          .valid("pending", "accepted", "declined", "finished")
          .min(0)
          .when("$required.order_status", {
            is: "required",
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
      ),
    });
  },

  product_id: function () {
    return Joi.object({
      product_id: Joi.number().integer().when("$required.product_id", {
        is: "required",
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  table_number: function () {
    return Joi.object({
      table_number: Joi.number().integer().when("$required.table_number", {
        is: "required",
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    });
  },

  observation: function () {
    return Joi.object({
      observation: Joi.string()
        .replace(
          /(\s|\p{C}|\u2800|\u034f|\u115f|\u1160|\u17b4|\u17b5|\u3164|\uffa0)+$|\u0000/gsu,
          "",
        )
        .max(160)
        .allow("")
        .when("$required.observation", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
    });
  },

  additional_ingredients: function () {
    return Joi.object({
      additional_ingredients: Joi.array()
        .items(
          Joi.object({
            ingredient_id: Joi.number().integer().positive().required(),
            multiplied: Joi.number().integer().positive().required(),
            price: Joi.number().positive().required(),
          }).when("$required.additional_ingredients", {
            is: "required",
            then: Joi.required(),
            otherwise: Joi.optional(),
          }),
        )
        .min(1),
    });
  },

  removed_ingredients: function () {
    return Joi.object({
      removed_ingredients: Joi.array()
        .items(Joi.number().integer().positive())
        .min(0)
        .unique()
        .when("$required.removed_ingredients", {
          is: "required",
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
    });
  },
};
