const router = require("express").Router()
const controller = require("../controllers/categoryController")
const auth = require("../middleware/auth")
const validate = require("../middleware/validate")
const asyncHandler = require("../utils/asyncHandler")
const { idParams } = require("../validations/common")
const { createCategory, updateCategory, searchCategory } = require("../validations/category")

router.get("/search", validate(searchCategory, "query"), asyncHandler(controller.search))
router.get("/:id", validate(idParams, "params"), asyncHandler(controller.getById))

router.post("/", auth, validate(createCategory), asyncHandler(controller.create))
router.put("/:id", auth, validate(idParams, "params"), validate(updateCategory), asyncHandler(controller.update))
router.delete("/:id", auth, validate(idParams, "params"), asyncHandler(controller.remove))

module.exports = router
