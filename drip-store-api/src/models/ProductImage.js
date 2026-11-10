
module.exports = (sequelize, DataTypes) => {
  const ProductImage = sequelize.define(
    "ProductImage",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      product_id: { type: DataTypes.INTEGER, allowNull: false },
      enabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
      path: { type: DataTypes.STRING, allowNull: false },
    },
    { tableName: "product_images", timestamps: false, underscored: true }
  )

  return ProductImage
}
