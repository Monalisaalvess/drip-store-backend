"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    //Armazena as imagens associadas a cada produto.
    await queryInterface.createTable("product_images", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      enabled: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      path: { type: Sequelize.STRING, allowNull: false },
    })
// Otimiza a consulta de imagens por produto.
    await queryInterface.addIndex("product_images", ["product_id"])
  },
  async down(queryInterface) {
    await queryInterface.dropTable("product_images")
  },
}
