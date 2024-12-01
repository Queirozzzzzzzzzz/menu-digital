import { NotFoundError } from "errors";
import db from "infra/database";

async function create(values, options = {}) {
  const query = {
    text: `
    INSERT INTO orders (order_id, product_id, price, table_number, observation)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `,
    values: [
      values.order_id,
      values.product_id,
      values.price,
      values.table_number,
      values.observation,
    ],
  };

  const res = await db.query(query, { transaction: options.transaction });

  return res.rows[0];
}

async function setIngredients(id, values, options = {}) {
  if (values.additional_ingredients) {
    const queryText = {
      text: `
      INSERT INTO additional_ingredients (ingredient_id, order_id, multiplied, price)
      VALUES ($1, $2, $3, $4);
      `,
    };

    const queries = [];
    values.additional_ingredients.forEach((v) => {
      const ingredientValues = [v.ingredient_id, id, v.multiplied, v.price];

      queries.push({
        ...queryText,
        values: ingredientValues,
      });
    });

    for (const q of queries) {
      await db.query(q, { transaction: options.transaction });
    }
  }

  if (values.removed_ingredients) {
    const queryText = {
      text: `
    INSERT INTO removed_ingredients (ingredient_id, order_id)
    VALUES ($1, $2);
    `,
    };

    const queries = [];
    values.removed_ingredients.forEach((v) => {
      queries.push({
        ...queryText,
        values: [v, id],
      });
    });

    for (const q of queries) {
      await db.query(q, { transaction: options.transaction });
    }
  }
}

async function listByStatus(status = [], options = {}) {
  const query = {
    text: `
    SELECT 
      o.*,
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'name', p.name,
            'price', p.price
          )
        )
        FROM products p
        WHERE p.id = o.product_id),
        '[]'
      ) AS product,
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'name', i.name,
            'multiplied', ai.multiplied,
            'price', ai.price
          )
        )
        FROM additional_ingredients ai
        JOIN ingredients i ON i.id = ai.ingredient_id
        WHERE ai.order_id = o.id),
        '[]'
      ) AS additional_ingredients,
      COALESCE(
        (SELECT json_agg(
          json_build_object('name', ri.name)
        )
        FROM removed_ingredients r
        JOIN ingredients ri ON ri.id = r.ingredient_id
        WHERE r.order_id = o.id),
        '[]'
      ) AS removed_ingredients
    FROM orders o
    WHERE o.status = ANY($1);
    `,
    values: [status],
  };

  const res = await db.query(query, { transaction: options.transaction });

  return res.rows;
}

async function findById(id, options = {}) {
  const query = {
    text: `
    SELECT 
      o.*,
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'name', i.name,
            'multiplied', ai.multiplied,
            'price', ai.price
          )
        )
        FROM additional_ingredients ai
        JOIN ingredients i ON i.id = ai.ingredient_id
        WHERE ai.order_id = o.id), 
        '[]'
      ) AS additional_ingredients,
      COALESCE(
        (SELECT json_agg(
          json_build_object(
            'name', ri.name
          )
        )
        FROM removed_ingredients r
        JOIN ingredients ri ON ri.id = r.ingredient_id
        WHERE r.order_id = o.id), 
        '[]'
      ) AS removed_ingredients
    FROM orders o
    WHERE o.id = $1
    GROUP BY o.id;
    `,
    values: [id],
  };

  const res = await db.query(query, { transaction: options.transaction });

  if (res.rowCount === 0) {
    throw new NotFoundError({
      message: `O pedido não foi encontrado no sistema.`,
      action: 'Verifique se o "id" do pedido está digitado corretamente.',
      stack: new Error().stack,
    });
  }

  return res.rows[0];
}

async function setStatus(orderId, status = [], options = {}) {
  const query = {
    text: `
    UPDATE orders
    SET status = $2
    WHERE order_id = $1
    RETURNING *;
    `,
    values: [orderId, status[0]],
  };

  const res = await db.query(query, { transaction: options.transaction });

  if (res.rowCount === 0) {
    throw new NotFoundError({
      message: `O pedido não foi encontrado no sistema.`,
      action: 'Verifique se o "order_id" do pedido está digitado corretamente.',
      stack: new Error().stack,
    });
  }

  return res.rows[0];
}

const order = {
  create,
  setIngredients,
  listByStatus,
  findById,
  setStatus,
};

export default order;
