const router = require("express").Router()
const controller = require("../controllers/userController")
const auth = require("../middleware/auth")
const validate = require("../middleware/validate")
const asyncHandler = require("../utils/asyncHandler")
const { idParams } = require("../validations/common")
const { createUser, updateUser, login } = require("../validations/user")

// Rotas públicas
router.post("/token", validate(login), asyncHandler(controller.token))
router.post("/", validate(createUser), asyncHandler(controller.create))
router.get("/:id", validate(idParams, "params"), asyncHandler(controller.getById))

// Rotas protegidas 
router.put("/:id", auth, validate(idParams, "params"), validate(updateUser), asyncHandler(controller.update))
router.delete("/:id", auth, validate(idParams, "params"), asyncHandler(controller.remove))

module.exports = router
