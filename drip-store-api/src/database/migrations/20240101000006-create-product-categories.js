"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_categories", {
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "categories", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    })
  // Otimiza consultas e filtros realizados pelo identificador da categoria.
    await queryInterface.addIndex("product_categories", ["category_id"])
  },
  async down(queryInterface) {
    await queryInterface.dropTable("product_categories")
  },
}
