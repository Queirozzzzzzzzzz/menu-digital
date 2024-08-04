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

    table_number: {
      type: "integer",
      notNull: true,
    },

    observation: {
      type: "varchar(256)",
    },

    status: {
      type: "varchar(10)",
      check: "status IN ('pending', 'accepted', 'declined', 'finished')",
      default: "pending",
      notNull: true,
    },

    created_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },

    updated_at: {
      type: "timestamp with time zone",
      notNull: true,
      default: pgm.func("(now() at time zone 'utc')"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("orders");
};
