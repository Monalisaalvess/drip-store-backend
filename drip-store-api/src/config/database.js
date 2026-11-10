require("dotenv").config({ quiet: true })
const mysql = {
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || "digital_store",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || null,
  logging: false,
  define: { underscored: true },
}

module.exports = {
  development: mysql,
  production: mysql,
  test: {
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
    define: { underscored: true },
  },
}
