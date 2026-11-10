const os = require("os")
const path = require("path")

process.env.NODE_ENV = "test"
process.env.JWT_SECRET = "test-secret"
process.env.BASE_URL = "http://localhost:3000"
process.env.UPLOAD_DIR = path.join(os.tmpdir(), `digital-store-uploads-${process.pid}`)
