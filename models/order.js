import { NotFoundError } from "errors";
import db from "infra/database";

async function create(values, options = {}) {
  const query = {
    text: `
    INSERT INTO orders (product_id, price, table_number, observation)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `,
    values: [
      values.product_id,
      values.price,
      values.table_number,
      values.observation,
    ],
  };

  const orderRes = await db.query(query, options);

  return orderRes.rows[0];
}

async function listByStatus(status = [], options = {}) {
  const query = {
    text: `
    SELECT *
    FROM orders
    WHERE status = ANY($1);
    `,
    values: [status],
  };

  const res = await db.query(query, options);

  return res.rows;
}

async function findById(id, options = {}) {
  const query = {
    text: `
    SELECT *
    FROM orders
    WHERE id = $1;
    `,
    values: [id],
  };

  const res = await db.query(query, options);

  if (res.rowCount === 0) {
    throw new NotFoundError({
      message: `O pedido não foi encontrado no sistema.`,
      action: 'Verifique se o "id" do pedido está digitado corretamente.',
      stack: new Error().stack,
    });
  }

  return res.rows[0];
}

async function setStatus(id, status = [], options = {}) {
  const query = {
    text: `
    UPDATE orders
    SET status = $2
    WHERE id = $1
    RETURNING *;
    `,
    values: [id, status[0]],
  };

  const res = await db.query(query, options);

  if (res.rowCount === 0) {
    throw new NotFoundError({
      message: `O pedido não foi encontrado no sistema.`,
      action: 'Verifique se o "id" do pedido está digitado corretamente.',
      stack: new Error().stack,
    });
  }

  return res.rows[0];
}

const order = {
  create,
  listByStatus,
  findById,
  setStatus,
};

export default order;
