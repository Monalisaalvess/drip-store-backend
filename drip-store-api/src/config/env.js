//carrega as variáveis de ambiente definidas no .env
require("dotenv").config({ quiet: true })
const path = require("path")
//verifica se a aplicação está sendo executada em ambiente de teste
const isTest = process.env.NODE_ENV === "test"
//porta do servidor
const port = Number(process.env.PORT) || 3000  

module.exports = {
  isTest,
  port,
  baseUrl: (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/$/, ""),
  jwtSecret: process.env.JWT_SECRET || (isTest ? "test-secret" : undefined),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  uploadDir: path.resolve(process.env.UPLOAD_DIR || "uploads"),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  }
