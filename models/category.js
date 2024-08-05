import { NotFoundError } from "errors";
import db from "infra/database";

async function create(name, options = {}) {
  const query = {
    text: `
    INSERT INTO categories (name)
    VALUES ($1)
    RETURNING *;
    `,
    values: [name],
  };

  const res = await db.query(query, options);

  return res.rows[0];
}

async function edit(id, values, options = {}) {
  const oldCategory = await findById(id);
  values = { ...oldCategory, ...values };

  const query = {
    text: `
    UPDATE categories 
    SET 
      name = $2,
      status = $3,
      updated_at = (now() at time zone 'utc')
    WHERE id = $1
    RETURNING *;
    `,
    values: [id, values.name, values.status],
  };

  const res = await db.query(query, options);

  return res.rows[0];
}

async function listByStatus(status = [], options = {}) {
  const query = {
    text: `
    SELECT *
    FROM categories
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
    FROM categories
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

async function setStatus(id, status, options = {}) {
  const query = {
    text: `
    UPDATE categories
    SET status = $2
    WHERE id = $1
    RETURNING *;
    `,
    values: [id, status],
  };

  const res = await db.query(query, options);

  return res.rows;
}

const category = {
  create,
  edit,
  listByStatus,
  findById,
  setStatus,
};

export default category;
