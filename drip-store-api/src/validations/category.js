const { Joi, messages, pagination, fieldsList } = require("./common")

const slug = Joi.string().trim().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).messages({
  "string.pattern.base": "O campo slug deve ter só letras minúsculas, números e hífens (ex.: black-friday)",
})

const createCategory = Joi.object({
  name: Joi.string().trim().required(),
  slug: slug.required(),
  use_in_menu: Joi.boolean().default(false),
}).messages(messages)

const updateCategory = Joi.object({
  name: Joi.string().trim().required(),
  slug: slug.required(),
  use_in_menu: Joi.boolean(),
}).messages(messages)

const searchCategory = Joi.object({
  ...pagination,
  fields: fieldsList(["id", "name", "slug", "use_in_menu"]),
  use_in_menu: Joi.boolean(),
}).messages(messages)

module.exports = { createCategory, updateCategory, searchCategory }
