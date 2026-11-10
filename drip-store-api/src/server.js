const env = require("./config/env")
const app = require("./app")
const { sequelize } = require("./models")

async function start() {
  if (!env.jwtSecret) {
    console.error("Defina JWT_SECRET no arquivo .env antes de iniciar a API.")
    process.exit(1)
  }

  try {
    await sequelize.authenticate()
    console.log("Banco de dados conectado.")
  } catch (error) {
    console.error("Não foi possível conectar ao banco de dados:", error.message)
    console.error("Confira o MySQL e as variáveis DB_* do .env, e rode: npm run db:migrate")
    process.exit(1)
  }

  app.listen(env.port, () => {
    console.log(`API rodando em http://localhost:${env.port}`)
    console.log(`Documentação em http://localhost:${env.port}/api-docs`)
  })
}

start()
