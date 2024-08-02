exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "serial",
      primaryKey: true,
    },

    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },

    password: {
      type: "varchar(72)",
      notNull: true,
    },

    features: {
      type: "varchar[]",
      notNull: true,
      default: `{}`,
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
  pgm.dropTable("users");
};
