exports.up = (pgm) => {
  pgm.createTable("additional_ingredients", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    ingredient_id: {
      type: "integer",
      references: "ingredients(id)",
      notNull: true,
    },

    order_id: {
      type: "integer",
      references: "orders(id)",
      notNull: true,
    },

    multiplied: {
      type: "integer",
      notNull: true,
    },

    price: {
      type: "decimal(10, 2)",
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("additional_ingredients");
};
