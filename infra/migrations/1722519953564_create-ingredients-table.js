exports.up = (pgm) => {
  pgm.createTable("ingredients", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    name: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },

    value: {
      type: "integer",
    },

    price: {
      type: "decimal(10, 2)",
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
  pgm.dropTable("ingredients");
};
