const Joi = require("joi")
const messages = {
  "any.required": "O campo {#label} é obrigatório",
  "string.empty": "O campo {#label} não pode ser vazio",
  "string.email": "O campo {#label} deve ser um e-mail válido",
  "any.only": "O campo {#label} possui um valor inválido",
}

const idParams = Joi.object({ id: Joi.number().integer().positive().required() })
const pagination = {
  limit: Joi.number().integer().min(-1).invalid(0).default(12),
  page: Joi.number().integer().min(1).default(1),
}

const fieldsList = (allowed) =>
  Joi.string().custom((value, helpers) => {
    const list = value.split(",").map((f) => f.trim()).filter(Boolean)
    const invalid = list.filter((f) => !allowed.includes(f))
    if (list.length === 0 || invalid.length) {
      return helpers.message(`Campos inválidos em "fields": ${invalid.join(", ") || "vazio"}. Permitidos: ${allowed.join(", ")}`)
    }
    return list
  })

module.exports = { Joi, messages, idParams, pagination, fieldsList }