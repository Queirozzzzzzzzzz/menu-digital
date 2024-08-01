exports.up = (pgm) => {
  pgm.createTable("removed_ingredients", {
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
  });
};

exports.down = (pgm) => {
  pgm.dropTable("removed_ingredients");
};
