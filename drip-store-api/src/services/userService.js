const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const env = require("../config/env")
const { User } = require("../models")
const AppError = require("../utils/AppError")

const SALT_ROUNDS = 10

async function findOrFail(id) {
  const user = await User.findByPk(id)
  if (!user) throw new AppError(404, "Usuário não encontrado")
  return user
}

async function assertEmailAvailable(email, ignoreId) {
  const existing = await User.findOne({ where: { email } })
  if (existing && existing.id !== ignoreId) throw new AppError(400, "E-mail já cadastrado")
}

async function getById(id) {
  return findOrFail(id)
}

async function create({ firstname, surname, email, password }) {
  await assertEmailAvailable(email)
  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  return User.create({ firstname, surname, email, password: hash })
}

async function update(id, { firstname, surname, email }) {
  const user = await findOrFail(id)
  await assertEmailAvailable(email, user.id)
  await user.update({ firstname, surname, email })
}

async function remove(id) {
  const user = await findOrFail(id)
  await user.destroy()
}

async function generateToken({ email, password }) {
  const user = await User.findOne({ where: { email } })
  const valid = user && (await bcrypt.compare(password, user.password))
  if (!valid) throw new AppError(400, "E-mail ou senha inválidos")

  return jwt.sign({ id: user.id, email: user.email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

module.exports = { getById, create, update, remove, generateToken }
