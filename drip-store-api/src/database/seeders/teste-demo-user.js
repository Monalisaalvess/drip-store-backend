"use strict"
const bcrypt = require("bcrypt")
const EMAIL = "admin@digitalstore.com"
module.exports = {
  async up(queryInterface) {
    const now = new Date()
    await queryInterface.bulkInsert("users", [
      {
        firstname: "Admin",
        surname: "Digital Store",
        email: EMAIL,
        password: await bcrypt.hash("123456", 10),
        created_at: now,
        updated_at: now,
      },
    ])
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { email: EMAIL })
  },
}
