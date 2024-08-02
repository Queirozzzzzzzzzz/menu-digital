import { ValidationError, NotFoundError } from "errors";
import db from "infra/database";
import validator from "models/validator";
import authentication from "models/authentication";

async function create(rawData, options) {
  const validData = validatePostSchema(rawData);
  await validateUniqueUsername(validData.username);
  await hashPasswordInObject(validData);

  if (!validData.features) validData.features = [];

  const query = {
    text: `
    INSERT INTO users (username, password, features) 
    VALUES ($1, $2, $3) 
    RETURNING *;
    `,
    values: [validData.username, validData.password, validData.features],
  };

  const res = await db.query(query, options);
  const newUser = res.rows[0];

  return newUser;
}

async function remove(username, options) {
  const query = {
    text: `
    DELETE FROM users
    WHERE username = $1
    RETURNING *;
    `,
    values: [username],
  };

  const res = await db.query(query, options);

  return res.rows[0];
}

async function findByUsername(username, options) {
  const query = {
    text: `
    SELECT * 
    FROM users 
    WHERE LOWER(username) = LOWER($1) 
    LIMIT 1;`,
    values: [username],
  };

  const res = await db.query(query, options);

  if (res.rowCount === 0) {
    throw new NotFoundError({
      message: `O usuário informado não foi encontrado no sistema.`,
      action: "Verifique se o username está digitado corretamente.",
      stack: new Error().stack,
      errorLocationCode: "MODEL:USER:FIND_BY_USERNAME:NOT_FOUND",
      key: "username",
    });
  }

  return res.rows[0];
}

async function findById(id, options) {
  const query = {
    text: `
    SELECT * 
    FROM users 
    WHERE id = $1
    ;`,
    values: [id],
  };

  const res = await db.query(query, options);

  if (res.rowCount === 0) {
    throw new NotFoundError({
      message: `O usuário informado não foi encontrado no sistema.`,
      action: "Verifique se o username está digitado corretamente.",
      stack: new Error().stack,
      errorLocationCode: "MODEL:USER:FIND_BY_ID:NOT_FOUND",
      key: "id",
    });
  }

  return res.rows[0];
}

async function addFeatures(id, features, options) {
  const query = {
    text: `
    UPDATE users
    SET features = array_cat(features, $2), updated_at = (now() at time zone 'utc')
    WHERE id = $1
    RETURNING *;
    `,
    values: [id, features],
  };

  const res = await db.query(query, options);

  return res.rows[0];
}

// Private functions
function validatePostSchema(postedUserData) {
  const cleanValues = validator(postedUserData, {
    username: "required",
    password: "required",
  });

  return cleanValues;
}

async function validateUniqueUsername(username, options) {
  const query = {
    text: `
    SELECT 
      username 
    FROM 
      users 
    WHERE 
      LOWER(username) = LOWER($1)
    ;`,
    values: [username],
  };

  const res = await db.query(query, options);

  if (res.rowCount > 0) {
    throw new ValidationError({
      message: `O "username" informado já está sendo usado.`,
      stack: new Error().stack,
      errorLocationCode: "MODEL:USER:VALIDATE_UNIQUE_USERNAME:ALREADY_EXISTS",
      key: "username",
    });
  }
}

async function hashPasswordInObject(obj) {
  obj.password = await authentication.hashPassword(obj.password);
  return obj;
}

const user = {
  create,
  remove,
  findByUsername,
  addFeatures,
  findById,
};

export default user;
