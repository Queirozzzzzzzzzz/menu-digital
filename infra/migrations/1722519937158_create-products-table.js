exports.up = (pgm) => {
  pgm.createTable("products", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    ingredients_ids: {
      type: "integer[]",
    },

    name: {
      type: "varchar(128)",
      notNull: true,
      unique: true,
    },

    category: {
      type: "varchar(10)",
      notNull: true,
      check: "category IN ('coffees', 'sweets', 'snacks', 'teas')",
    },

    status: {
      type: "varchar(10)",
      notNull: true,
      default: "available",
      check: "status IN ('available', 'missing', 'disabled')",
    },

    price: {
      type: "decimal(10, 2)",
      notNull: true,
    },

    picture: {
      type: "varchar(255)",
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
  pgm.dropTable("products");
};
