const fs = require("fs/promises")
const path = require("path")
const crypto = require("crypto")
const env = require("../config/env")
const AppError = require("../utils/AppError")
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB por imagem

function detectExtension(buffer) {
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png"
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg"
  if (buffer.length > 6 && buffer.subarray(0, 3).toString() === "GIF") return "gif"
  if (buffer.length > 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "webp"
  return null
}

const isUrl = (value) => /^https?:\/\//i.test(value)
async function saveBase64(productId, content) {
  const base64 = content.replace(/^data:[^;]+;base64,/, "")
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64.replace(/\s/g, ""))) {
    throw new AppError(400, "Imagem inválida: o conteúdo precisa estar em base64")
  }

  const buffer = Buffer.from(base64, "base64")
  const extension = detectExtension(buffer)
  if (!extension) throw new AppError(400, "Imagem inválida: envie um arquivo png, jpg, gif ou webp")
  if (buffer.length > MAX_BYTES) throw new AppError(400, "Imagem muito grande (máximo de 5 MB)")

  const relativePath = path.posix.join("products", String(productId), `${crypto.randomUUID()}.${extension}`)
  const absolute = path.join(env.uploadDir, relativePath)
  await fs.mkdir(path.dirname(absolute), { recursive: true })
  await fs.writeFile(absolute, buffer)
  return relativePath
}

async function remove(relativePath) {
  if (!relativePath || isUrl(relativePath)) return
  await fs.rm(path.join(env.uploadDir, relativePath), { force: true })
}

async function removeProductFolder(productId) {
  await fs.rm(path.join(env.uploadDir, "products", String(productId)), { recursive: true, force: true })
}

// Endereço público da imagem
function urlFor(relativePath) {
  return isUrl(relativePath) ? relativePath : `${env.baseUrl}/media/${relativePath}`
}

module.exports = { saveBase64, remove, removeProductFolder, urlFor, isUrl }
