const jwt = require("jsonwebtoken")
const env = require("../config/env")
const AppError = require("../utils/AppError")

// Valida o token Bearer e disponibiliza os dados do usuário autenticado em req.user.
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || ""
  const [scheme, token] = header.split(" ")

  if (scheme !== "Bearer" || !token) {
    return next(new AppError(401, "Token de autorização não enviado"))
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret)
    return next()
  } catch {
    return next(new AppError(401, "Token de autorização inválido ou expirado"))
  }
}
