exports.up = async (pgm) => {
  await pgm.addColumns("products", {
    category_id: {
      type: "integer",
      references: "categories(id)",
      notNull: true,
    },
  });
};

exports.down = false;
