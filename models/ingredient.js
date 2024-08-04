import { NotFoundError } from "errors";
import db from "infra/database";

async function create(values, options = {}) {
  const query = {
    text: `
    INSERT INTO ingredients (name, value, price)
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
    values: [values.name, values.value, values.price],
  };

  const res = await db.query(query, options);

  return res.rows[0];
}

async function edit(id, values, options = {}) {
  const oldIngredient = await findById(id);
  values = { ...oldIngredient, ...values };

  const query = {
    text: `
    UPDATE ingredients 
    SET 
      name = $2,
      value = $3,
      price = $4,
      updated_at = (now() at time zone 'utc')
    WHERE id = $1
    RETURNING *;
    `,
    values: [id, values.name, values.value, values.price],
  };

  const res = await db.query(query, options);

  return res.rows[0];
}

async function list(options = {}) {
  const query = {
    text: `
    SELECT *
    FROM ingredients;
    `,
    values: [],
  };

  const res = await db.query(query, options);

  return res.rows;
}

async function findById(id, options = {}) {
  const query = {
    text: `
    SELECT *
    FROM ingredients
    WHERE id = $1;
    `,
    values: [id],
  };

  const res = await db.query(query, options);

  if (res.rowCount === 0) {
    throw new NotFoundError({
      message: `O ingrediente não foi encontrado no sistema.`,
      action: 'Verifique se o "id" do ingrediente está digitado corretamente.',
      stack: new Error().stack,
    });
  }

  return res.rows[0];
}

const ingredient = {
  create,
  edit,
  list,
  findById,
};

export default ingredient;
