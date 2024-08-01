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
      type: "varchar(255)",
    },

    price: {
      type: "decimal(10, 2)",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("ingredients");
};
