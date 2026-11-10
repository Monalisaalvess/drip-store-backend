const { Sequelize, DataTypes } = require("sequelize")
const configs = require("../config/database")
const env = process.env.NODE_ENV || "development"
const config = configs[env]
const sequelize =
  config.dialect === "sqlite"
    ? new Sequelize(config)
    : new Sequelize(config.database, config.username, config.password, config)

const User = require("./User")(sequelize, DataTypes)
const Category = require("./Category")(sequelize, DataTypes)
const Product = require("./Product")(sequelize, DataTypes)
const ProductImage = require("./ProductImage")(sequelize, DataTypes)
const ProductOption = require("./ProductOption")(sequelize, DataTypes)
const ProductCategory = require("./ProductCategory")(sequelize, DataTypes)

Product.hasMany(ProductImage, { foreignKey: "product_id", as: "images", onDelete: "CASCADE" })
ProductImage.belongsTo(Product, { foreignKey: "product_id" })
Product.hasMany(ProductOption, { foreignKey: "product_id", as: "options", onDelete: "CASCADE" })
ProductOption.belongsTo(Product, { foreignKey: "product_id" })
Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: "product_id",
  otherKey: "category_id",
  as: "categories",
})
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: "category_id",
  otherKey: "product_id",
  as: "products",
})

module.exports = { sequelize, Sequelize, User, Category, Product, ProductImage, ProductOption, ProductCategory }
