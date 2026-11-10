const router = require("express").Router()
const controller = require("../controllers/productController")
const auth = require("../middleware/auth")
const validate = require("../middleware/validate")
const asyncHandler = require("../utils/asyncHandler")
const { idParams } = require("../validations/common")
const { createProduct, updateProduct, searchProduct } = require("../validations/product")

router.get("/search", validate(searchProduct, "query"), asyncHandler(controller.search))
router.get("/:id", validate(idParams, "params"), asyncHandler(controller.getById))

router.post("/", auth, validate(createProduct), asyncHandler(controller.create))
router.put("/:id", auth, validate(idParams, "params"), validate(updateProduct), asyncHandler(controller.update))
router.delete("/:id", auth, validate(idParams, "params"), asyncHandler(controller.remove))

module.exports = router
