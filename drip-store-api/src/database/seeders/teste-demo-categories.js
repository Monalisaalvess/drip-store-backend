"use strict"
const slugs = ["camisetas", "calcas", "bones", "headphones", "tenis"]
module.exports = {
  async up(queryInterface) {
    const now = new Date()
    await queryInterface.bulkInsert("categories", [
      { name: "Camisetas", slug: "camisetas", use_in_menu: true, created_at: now, updated_at: now },
      { name: "Calças", slug: "calcas", use_in_menu: true, created_at: now, updated_at: now },
      { name: "Bonés", slug: "bones", use_in_menu: true, created_at: now, updated_at: now },
      { name: "Headphones", slug: "headphones", use_in_menu: true, created_at: now, updated_at: now },
      { name: "Tênis", slug: "tenis", use_in_menu: true, created_at: now, updated_at: now },
    ])
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("categories", { slug: { [Sequelize.Op.in]: slugs } })
  },
}
