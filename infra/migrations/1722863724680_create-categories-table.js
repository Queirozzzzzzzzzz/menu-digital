exports.up = (pgm) => {
  pgm.createTable("categories", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    name: {
      type: "varchar(128)",
      notNull: true,
      unique: true,
    },

    status: {
      type: "varchar(10)",
      check: "status IN ('available', 'disabled')",
      default: "available",
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
  pgm.dropTable("categories");
};
