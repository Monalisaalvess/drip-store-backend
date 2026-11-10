const { Joi, messages, pagination, fieldsList } = require("./common")
const IMAGE_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"]
const slug = Joi.string().trim().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).messages({
  "string.pattern.base": "O campo slug deve ter só letras minúsculas, números e hífens (ex.: produto-01)",
})

const id = Joi.number().integer().positive()
const radius = Joi.alternatives(Joi.number().integer().min(0), Joi.string().pattern(/^\d+(px)?$/))
const values = Joi.alternatives(Joi.array().items(Joi.string().trim().min(1)).min(1), Joi.string().trim().min(1))
const newImage = Joi.object({
  type: Joi.string().valid(...IMAGE_TYPES).required(),
  content: Joi.string().required(),
})
const deleteImage = Joi.object({ id: id.required(), deleted: Joi.boolean().valid(true).required() })
const replaceImage = Joi.object({
  id: id.required(),
  type: Joi.string().valid(...IMAGE_TYPES),
  content: Joi.string().required(), 
})

const optionFields = {
  title: Joi.string().trim(),
  shape: Joi.string().valid("square", "circle"),
  radius,
  type: Joi.string().valid("text", "color"),
  values,
  value: values, 
}
const newOption = Joi.object({ ...optionFields, title: optionFields.title.required() }).or("values", "value")
const deleteOption = Joi.object({ id: id.required(), deleted: Joi.boolean().valid(true).required() })
const updateOption = Joi.object({ id: id.required(), ...optionFields })

const base = {
  enabled: Joi.boolean(),
  use_in_menu: Joi.boolean(),
  stock: Joi.number().integer().min(0),
  description: Joi.string().allow("").max(1000),
  price: Joi.number().min(0),
  price_with_discount: Joi.number().min(0),
  category_ids: Joi.array().items(id).unique(),
}

const createProduct = Joi.object({
  ...base,
  name: Joi.string().trim().required(),
  slug: slug.required(),
  price: base.price.required(),
  price_with_discount: base.price_with_discount.required(),
  images: Joi.array().items(newImage),
  options: Joi.array().items(newOption),
}).messages(messages)

const updateProduct = Joi.object({
  ...base,
  name: Joi.string().trim(),
  slug,
  images: Joi.array().items(Joi.alternatives().try(deleteImage, replaceImage, newImage)),
  options: Joi.array().items(Joi.alternatives().try(deleteOption, updateOption, newOption)),
})
  .min(1)
  .messages(messages)

const PRODUCT_FIELDS = [
  "id", "enabled", "name", "slug", "use_in_menu", "stock", "description",
  "price", "price_with_discount", "category_ids", "images", "options",
]

const searchProduct = Joi.object({
  ...pagination,
  fields: fieldsList(PRODUCT_FIELDS),
  match: Joi.string().trim().min(1),
  category_ids: Joi.string().pattern(/^\d+(,\d+)*$/).custom((v) => v.split(",").map(Number)).messages({
    "string.pattern.base": "category_ids deve ser uma lista de ids separados por vírgula (ex.: 15,24)",
  }),
  "price-range": Joi.string()
    .pattern(/^\d+(\.\d+)?-\d+(\.\d+)?$/)
    .custom((v, helpers) => {
      const [min, max] = v.split("-").map(Number)
      return min <= max ? [min, max] : helpers.message("price-range: o valor mínimo deve ser menor ou igual ao máximo")
    })
    .messages({ "string.pattern.base": "price-range deve seguir o formato min-max (ex.: 100-200)" }),
 
  option: Joi.object().pattern(
    /^\d+$/,
    Joi.string().custom((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
  ),
}).messages(messages)

module.exports = { createProduct, updateProduct, searchProduct, PRODUCT_FIELDS }
