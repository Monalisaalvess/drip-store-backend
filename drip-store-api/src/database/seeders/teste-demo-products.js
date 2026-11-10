"use strict"

const products = [
  ["Air Jordan 1 Mid Masculino", "air-jordan-1-mid-masculino", 200, 149.9],
  ["Air Jordan 1 Chicago Masculino", "air-jordan-1-chicago-masculino", 349.9, 349.9],
  ["Sapatênis Levi's Marrom Masculino", "sapatenis-levis-marrom-masculino", 259.9, 219.9],
  ["Tênis Karhu Synchron Unissex", "tenis-karhu-synchron-unissex", 489.9, 489.9],
  ["Tênis Nike SuperRep Go Masculino", "tenis-nike-superrep-go-masculino", 399.9, 299.9],
  ["Air Jordan 1 Mid Feminino", "air-jordan-1-mid-feminino", 229.9, 179.9],
  ["Air Jordan 1 Chicago Feminino", "air-jordan-1-chicago-feminino", 329.9, 329.9],
  ["Sapatênis Levi's Marrom Unissex", "sapatenis-levis-marrom-unissex", 239.9, 199.9],
]

const DESCRIPTION =
  "Descrição do produto. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()

    await queryInterface.bulkInsert(
      "products",
      products.map(([name, slug, price, price_with_discount]) => ({
        enabled: true,
        name,
        slug,
        use_in_menu: false,
        stock: 20,
        description: DESCRIPTION,
        price,
        price_with_discount,
        created_at: now,
        updated_at: now,
      }))
    )

    const slugs = products.map((p) => p[1])
    const rows = await queryInterface.sequelize.query("SELECT id FROM products WHERE slug IN (:slugs)", {
      replacements: { slugs },
      type: Sequelize.QueryTypes.SELECT,
    })
    const [category] = await queryInterface.sequelize.query("SELECT id FROM categories WHERE slug = 'tenis'", {
      type: Sequelize.QueryTypes.SELECT,
    })

    await queryInterface.bulkInsert(
      "product_options",
      rows.flatMap(({ id }) => [
        { product_id: id, title: "Tamanho", shape: "square", radius: 4, type: "text", values: "39,40,41,42,43" },
        { product_id: id, title: "Cor", shape: "circle", radius: 0, type: "color", values: "#6FEEFF,#FF6969,#5E5E5E,#6D70B7" },
      ])
    )

    if (category) {
      await queryInterface.bulkInsert(
        "product_categories",
        rows.map(({ id }) => ({ product_id: id, category_id: category.id }))
      )
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("products", { slug: { [Sequelize.Op.in]: products.map((p) => p[1]) } })
  },
}
