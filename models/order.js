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
  const res = await db.query(query);

  if (!res) console.error(values)

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
      await db.query(q);
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
      await db.query(q);
    }
  }
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
  setIngredients,
  listByStatus,
  findById,
  setStatus,
};

export default order;
