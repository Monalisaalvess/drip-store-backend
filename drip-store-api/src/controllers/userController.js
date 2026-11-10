const userService = require("../services/userService")

exports.getById = async (req, res) => {
  const user = await userService.getById(req.params.id)
  res.status(200).json(user)
}

exports.create = async (req, res) => {
  const user = await userService.create(req.body)
  res.status(201).json(user)
}

exports.update = async (req, res) => {
  await userService.update(req.params.id, req.body)
  res.status(204).send()
}

exports.remove = async (req, res) => {
  await userService.remove(req.params.id)
  res.status(204).send()
}

exports.token = async (req, res) => {
  const token = await userService.generateToken(req.body)
  res.status(200).json({ token })
}
