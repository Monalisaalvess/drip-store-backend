const AppError = require("../utils/AppError")

// erro 404 para rotas que não existem
function notFound(req, res, next) {
  next(new AppError(404, "Rota não encontrada"))
}
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message, details: err.details })
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "JSON inválido no corpo da requisição" })
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Corpo da requisição muito grande" })
  }
  if (["SequelizeValidationError", "SequelizeUniqueConstraintError"].includes(err.name)) {
    return res.status(400).json({ message: "Dados da requisição incorretos", details: err.errors.map((e) => e.message) })
  }

  console.error(err)
  return res.status(500).json({ message: "Erro interno do servidor" })
}

module.exports = { notFound, errorHandler }
