exports.up = (pgm) => {
  pgm.createTable("orders", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    product_id: {
      type: "integer",
      references: "products(id)",
      notNull: true,
    },

    price: {
      type: "decimal(10, 2)",
      notNull: true,
    },

    table: {
      type: "integer",
      notNull: true,
    },

    observation: {
      type: "varchar(256)",
    },

    status: {
      type: "varchar(10)",
      check: "status IN ('pending', 'accepted', 'declined', 'finished')",
      notNull: true,
    },

    ordered_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("orders");
};
