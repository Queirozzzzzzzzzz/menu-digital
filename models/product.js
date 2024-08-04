import { NotFoundError } from "errors";
import db from "infra/database";

async function create(values, options = {}) {
  const query = {
    text: `
    INSERT INTO products (ingredients_ids, name, category, price, picture)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `,
    values: [
      values.ingredients_ids,
      values.name,
      values.category,
      values.price,
      values.picture,
    ],
  };

  const res = await db.query(query, options);

  return res.rows[0];
}

async function edit(id, values, options = {}) {
  const oldContent = await findById(id);
  values = { ...oldContent, ...values };

  const query = {
    text: `
    UPDATE products 
    SET 
      ingredients_ids = $2, 
      name = $3, 
      category = $4, 
      price = $5, 
      picture = $6,
      updated_at = (now() at time zone 'utc')
    WHERE id = $1
    RETURNING *;
    `,
    values: [
      id,
      values.ingredients_ids,
      values.name,
      values.category,
      values.price,
      values.picture,
    ],
  };

  const res = await db.query(query, options);

  return res.rows[0];
}

async function listByStatus(status = [], options = {}) {
  const statusPlaceholder = status.length
    ? `${status.map((_, i) => `$${i + 1}`).join(", ")}`
    : "NULL";

  const query = {
    text: `
    SELECT *
    FROM products
    WHERE status IN (${statusPlaceholder});
    `,
    values: [...status],
  };

  const res = await db.query(query, options);

  return res.rows;
}

async function setStatus(name, status, options = {}) {
  const query = {
    text: `
    UPDATE products
    SET status = $2
    WHERE name = $1
    RETURNING *;
    `,
    values: [name, status],
  };

  const res = await db.query(query, options);

  return res.rows;
}

async function findById(id, options = {}) {
  const query = {
    text: `
    SELECT *
    FROM products
    WHERE id = $1;
    `,
    values: [id],
  };

  const res = await db.query(query, options);

  if (res.rowCount === 0) {
    throw new NotFoundError({
      message: `O produto não foi encontrado no sistema.`,
      action: 'Verifique se o "id" do produto está digitado corretamente.',
      stack: new Error().stack,
    });
  }

  return res.rows[0];
}

const product = {
  create,
  edit,
  listByStatus,
  setStatus,
  findById,
};

export default product;
