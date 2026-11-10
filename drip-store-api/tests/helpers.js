const request = require("supertest")
const app = require("../src/app")
const { sequelize } = require("../src/models")
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

const validUser = {
  firstname: "Maria",
  surname: "Silva",
  email: "maria@mail.com",
  password: "123@123",
  confirmPassword: "123@123",
}

async function createUserAndToken(overrides = {}) {
  const user = { ...validUser, ...overrides }
  const created = await request(app).post("/v1/user").send(user)
  const login = await request(app).post("/v1/user/token").send({ email: user.email, password: user.password })
  return { id: created.body.id, token: login.body.token }
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` })

const resetDatabase = () => sequelize.sync({ force: true })
const closeDatabase = () => sequelize.close()

module.exports = { request, app, PNG_BASE64, validUser, createUserAndToken, bearer, resetDatabase, closeDatabase }
