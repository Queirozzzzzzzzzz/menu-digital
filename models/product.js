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
      values.product_name,
      values.product_category,
      values.price,
      values.picture,
    ],
  };

  const res = await db.query(query, options);

  return res.rows[0];
}

async function listByStatus(status = [], options = {}) {
  const statusPlaceholder = status.length
    ? `(${status.map((_, i) => `$${i + 1}`).join(", ")})`
    : "(NULL)";

  const query = {
    text: `
    SELECT *
    FROM products
    WHERE status IN ${statusPlaceholder};
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

const product = {
  create,
  listByStatus,
  setStatus,
};

export default product;
