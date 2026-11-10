// Erro com status HTTP, tratado pelo middleware de erros
class AppError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

module.exports = AppError
