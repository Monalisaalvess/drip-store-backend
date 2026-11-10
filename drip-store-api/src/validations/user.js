const { Joi, messages } = require("./common")

const createUser = Joi.object({
  firstname: Joi.string().trim().required(),
  surname: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({ "any.only": "confirmPassword deve ser igual a password" }),
}).messages(messages)

const updateUser = Joi.object({
  firstname: Joi.string().trim().required(),
  surname: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
}).messages(messages)

const login = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
}).messages(messages)

module.exports = { createUser, updateUser, login }
