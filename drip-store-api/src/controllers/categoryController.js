const categoryService = require("../services/categoryService")

exports.search = async (req, res) => {
  res.status(200).json(await categoryService.search(req.validatedQuery))
}

exports.getById = async (req, res) => {
  res.status(200).json(await categoryService.getById(req.params.id))
}

exports.create = async (req, res) => {
  res.status(201).json(await categoryService.create(req.body))
}

exports.update = async (req, res) => {
  await categoryService.update(req.params.id, req.body)
  res.status(204).send()
}

exports.remove = async (req, res) => {
  await categoryService.remove(req.params.id)
  res.status(204).send()
}
