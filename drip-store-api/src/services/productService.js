const { Op, fn, col, where: sqlWhere } = require("sequelize")
const { sequelize, Product, ProductImage, ProductOption, ProductCategory, Category } = require("../models")
const imageStorage = require("./imageStorage")
const AppError = require("../utils/AppError")
const COLUMN_FIELDS = ["id", "enabled", "name", "slug", "use_in_menu", "stock", "description", "price", "price_with_discount"]
const SCALAR_FIELDS = COLUMN_FIELDS.filter((f) => f !== "id")
const splitValues = (text) => (text ? text.split(",") : [])

function formatOption(option) {
  const { id, title, shape, radius, type, values } = option
  return { id, title, shape, radius, type, values: splitValues(values) }
}
function serialize(product) {
  const json = product.toJSON()
  return {
    id: json.id,
    enabled: Boolean(json.enabled),
    name: json.name,
    slug: json.slug,
    use_in_menu: Boolean(json.use_in_menu),
    stock: json.stock,
    description: json.description,
    price: json.price,
    price_with_discount: json.price_with_discount,
    category_ids: (json.categories || []).map((c) => c.id),
    images: (json.images || []).map((image) => ({ id: image.id, content: imageStorage.urlFor(image.path) })),
    options: (json.options || []).map(formatOption),
  }
}

const pick = (object, fields) => (fields ? Object.fromEntries(fields.map((f) => [f, object[f]])) : object)
function buildIncludes(wanted) {
  const includes = []
  if (wanted.categories) includes.push({ model: Category, as: "categories", attributes: ["id"], through: { attributes: [] } })
  if (wanted.images) includes.push({ model: ProductImage, as: "images" })
  if (wanted.options) includes.push({ model: ProductOption, as: "options" })
  return includes
}
const ALL = { categories: true, images: true, options: true }
function buildOrder(wanted) {
  const order = [["id", "ASC"]]
  if (wanted.images) order.push([{ model: ProductImage, as: "images" }, "id", "ASC"])
  if (wanted.options) order.push([{ model: ProductOption, as: "options" }, "id", "ASC"])
  return order
}
function normalizeOption(option) {
  const data = {}
  if (option.title !== undefined) data.title = option.title
  if (option.shape) data.shape = option.shape
  if (option.radius !== undefined) data.radius = parseInt(option.radius, 10) // aceita 4 ou "4px"
  if (option.type) data.type = option.type
  const raw = option.values ?? option.value
  if (raw !== undefined) {
    const list = Array.isArray(raw) ? raw : String(raw).split(",")
    data.values = list.map((v) => v.trim()).filter(Boolean).join(",")
  }
  return data
}

function pickScalars(payload) {
  return Object.fromEntries(SCALAR_FIELDS.filter((f) => payload[f] !== undefined).map((f) => [f, payload[f]]))
}
async function assertCategoriesExist(ids, transaction) {
  if (!ids || ids.length === 0) return
  const found = await Category.count({ where: { id: ids }, transaction })
  if (found !== new Set(ids).size) throw new AppError(400, "Uma ou mais categorias informadas não existem")
}
async function findFull(id) {
  return Product.findByPk(id, { include: buildIncludes(ALL), order: buildOrder(ALL) })
}
async function getById(id) {
  const product = await findFull(id)
  if (!product) throw new AppError(404, "Produto não encontrado")
  return serialize(product)
}

const intersect = (sets) => sets.reduce((acc, set) => acc.filter((id) => set.includes(id)))

async function search({ limit, page, fields, match, category_ids, "price-range": range, option }) {
  const conditions = []

  if (match) {
    conditions.push({ [Op.or]: [{ name: { [Op.like]: `%${match}%` } }, { description: { [Op.like]: `%${match}%` } }] })
  }
  if (range) {
    const effectivePrice = fn("COALESCE", fn("NULLIF", col("price_with_discount"), 0), col("price"))
    conditions.push(sqlWhere(effectivePrice, { [Op.between]: range }))
  }
const idSets = []

  if (category_ids) {
    const links = await ProductCategory.findAll({ where: { category_id: category_ids }, attributes: ["product_id"], raw: true })
    idSets.push([...new Set(links.map((l) => l.product_id))])
  }

  if (option) {
    for (const [optionId, wanted] of Object.entries(option)) {
      const rows = await ProductOption.findAll({ where: { id: Number(optionId) }, attributes: ["product_id", "values"], raw: true })
      idSets.push(rows.filter((row) => splitValues(row.values).some((v) => wanted.includes(v))).map((row) => row.product_id))
    }
  }

  if (idSets.length) {
    const ids = intersect(idSets)
    if (ids.length === 0) return { data: [], total: 0, limit, page }
    conditions.push({ id: { [Op.in]: ids } })
  }

  const where = conditions.length ? { [Op.and]: conditions } : {}
  const total = await Product.count({ where })
  const pageQuery = { where, attributes: ["id"], order: [["id", "ASC"]], raw: true }
  if (limit !== -1) {
    pageQuery.limit = limit
    pageQuery.offset = (page - 1) * limit
  }
  const ids = (await Product.findAll(pageQuery)).map((row) => row.id)
  if (ids.length === 0) return { data: [], total, limit, page }
  const wanted = fields
    ? { categories: fields.includes("category_ids"), images: fields.includes("images"), options: fields.includes("options") }
    : ALL
  const attributes = fields ? [...new Set(["id", ...fields.filter((f) => COLUMN_FIELDS.includes(f))])] : COLUMN_FIELDS

  const products = await Product.findAll({
    where: { id: { [Op.in]: ids } },
    attributes,
    include: buildIncludes(wanted),
    order: buildOrder(wanted),
  })

  return { data: products.map((p) => pick(serialize(p), fields)), total, limit, page }
}

async function create(payload) {
  const savedPaths = []
  let createdId

  try {
    await sequelize.transaction(async (transaction) => {
      await assertCategoriesExist(payload.category_ids, transaction)

      const product = await Product.create(pickScalars(payload), { transaction })
      createdId = product.id

      if (payload.category_ids?.length) await product.setCategories(payload.category_ids, { transaction })

      for (const image of payload.images || []) {
        const path = await imageStorage.saveBase64(product.id, image.content)
        savedPaths.push(path)
        await ProductImage.create({ product_id: product.id, enabled: true, path }, { transaction })
      }

      if (payload.options?.length) {
        await ProductOption.bulkCreate(
          payload.options.map((option) => ({ product_id: product.id, ...normalizeOption(option) })),
          { transaction }
        )
      }
    })
  } catch (error) {
    await Promise.all(savedPaths.map((p) => imageStorage.remove(p)))
    if (createdId) await imageStorage.removeProductFolder(createdId)
    throw error
  }

  return getById(createdId)
}

async function update(id, payload) {
  const product = await Product.findByPk(id, {
    include: [
      { model: ProductImage, as: "images" },
      { model: ProductOption, as: "options" },
    ],
  })
  if (!product) throw new AppError(404, "Produto não encontrado")

  const newPaths = [] 
  const oldPaths = []

  try {
    await sequelize.transaction(async (transaction) => {
      await product.update(pickScalars(payload), { transaction })

      if (payload.category_ids) {
        await assertCategoriesExist(payload.category_ids, transaction)
        await product.setCategories(payload.category_ids, { transaction })
      }

      for (const item of payload.images || []) {
        if (item.id !== undefined) {
          const image = product.images.find((i) => i.id === item.id)
          if (!image) throw new AppError(400, `A imagem ${item.id} não pertence a este produto`)

          if (item.deleted) {
            await image.destroy({ transaction })
            oldPaths.push(image.path)
          } else if (!imageStorage.isUrl(item.content)) {
            const path = await imageStorage.saveBase64(product.id, item.content)
            newPaths.push(path)
            oldPaths.push(image.path)
            await image.update({ path }, { transaction })
          }
        } else {
          const path = await imageStorage.saveBase64(product.id, item.content)
          newPaths.push(path)
          await ProductImage.create({ product_id: product.id, enabled: true, path }, { transaction })
        }
      }
        for (const item of payload.options || []) {
        if (item.id !== undefined) {
          const option = product.options.find((o) => o.id === item.id)
          if (!option) throw new AppError(400, `A opção ${item.id} não pertence a este produto`)

          if (item.deleted) await option.destroy({ transaction })
          else await option.update(normalizeOption(item), { transaction })
        } else {
          await ProductOption.create({ product_id: product.id, ...normalizeOption(item) }, { transaction })
        }
      }
    })
  } catch (error) {
    await Promise.all(newPaths.map((p) => imageStorage.remove(p)))
    throw error
  }

  await Promise.all(oldPaths.map((p) => imageStorage.remove(p)))
}
async function remove(id) {
  const product = await Product.findByPk(id)
  if (!product) throw new AppError(404, "Produto não encontrado")
  await product.destroy()
  await imageStorage.removeProductFolder(id)
}

module.exports = { search, getById, create, update, remove }
