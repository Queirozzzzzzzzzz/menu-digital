import db from "infra/database";

async function create(values, options) {
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

const product = {
  create,
};

export default product;
