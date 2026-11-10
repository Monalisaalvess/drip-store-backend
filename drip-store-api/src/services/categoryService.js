const { Category } = require("../models")
const AppError = require("../utils/AppError")

async function findOrFail(id) {
  const category = await Category.findByPk(id)
  if (!category) throw new AppError(404, "Categoria não encontrada")
  return category
}

function format(category) {
  const { id, name, slug, use_in_menu } = category.toJSON()
  return { id, name, slug, use_in_menu: Boolean(use_in_menu) }
}
async function search({ limit, page, fields, use_in_menu }) {
  const where = {}
  if (use_in_menu !== undefined) where.use_in_menu = use_in_menu

  const options = { where, order: [["id", "ASC"]] }
  if (fields) options.attributes = fields
  if (limit !== -1) {
    options.limit = limit
    options.offset = (page - 1) * limit
  }

  const { rows, count } = await Category.findAndCountAll(options)

  const data = rows.map((row) => {
    const item = format(row)
    return fields ? Object.fromEntries(fields.map((f) => [f, item[f]])) : item
  })

  return { data, total: count, limit, page }
}

async function getById(id) {
  return format(await findOrFail(id))
}

async function create(data) {
  return format(await Category.create(data))
}

async function update(id, data) {
  const category = await findOrFail(id)
  await category.update(data)
}

async function remove(id) {
  const category = await findOrFail(id)
  await category.destroy()
}

module.exports = { search, getById, create, update, remove }
