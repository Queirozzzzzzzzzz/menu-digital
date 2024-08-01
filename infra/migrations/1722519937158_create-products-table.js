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
      type: "varchar(255)",
      notNull: true,
    },

    category: {
      type: "varchar(10)",
      notNull: true,
      check: "category IN ('coffee', 'sweets', 'snacks', 'teas')",
    },

    status: {
      type: "varchar(10)",
      notNull: true,
      check: "status IN ('available', 'missing', 'disabled')",
    },

    price: {
      type: "decimal(10, 2)",
      notNull: true,
    },

    picture: {
      type: "varchar(255)",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("products");
};
