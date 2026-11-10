const productService = require("../services/productService")

exports.search = async (req, res) => {
  res.status(200).json(await productService.search(req.validatedQuery))
}
exports.getById = async (req, res) => {
  res.status(200).json(await productService.getById(req.params.id))
}
exports.create = async (req, res) => {
  res.status(201).json(await productService.create(req.body))
}
exports.update = async (req, res) => {
  await productService.update(req.params.id, req.body)
  res.status(204).send()
}
exports.remove = async (req, res) => {
  await productService.remove(req.params.id)
  res.status(204).send()
}
