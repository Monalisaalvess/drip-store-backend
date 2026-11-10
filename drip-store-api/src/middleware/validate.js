const AppError = require("../utils/AppError")
module.exports = function validate(schema, source = "body") {
  return (req, res, next) => {
    const { value, error } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    })

    if (error) {
      const details = error.details.map((d) => d.message)
      return next(new AppError(400, "Dados da requisição incorretos", details))
    }

    if (source === "query") req.validatedQuery = value
    else req[source] = value
    return next()
  }
}
