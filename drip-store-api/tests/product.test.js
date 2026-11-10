const fs = require("fs")
const path = require("path")
const { request, app, PNG_BASE64, createUserAndToken, bearer, resetDatabase, closeDatabase } = require("./helpers")

let token
beforeEach(async () => {
  await resetDatabase()
  token = (await createUserAndToken()).token
  await request(app).post("/v1/category").set(bearer(token)).send({ name: "Tênis", slug: "tenis" })
  await request(app).post("/v1/category").set(bearer(token)).send({ name: "Camisetas", slug: "camisetas" })
})
afterAll(closeDatabase)

const payload = (overrides = {}) => ({
  enabled: true,
  name: "Tênis Nike",
  slug: "tenis-nike",
  stock: 10,
  description: "Tênis confortável para corrida",
  price: 200,
  price_with_discount: 150,
  category_ids: [1],
  images: [{ type: "image/png", content: PNG_BASE64 }],
  options: [
    { title: "Tamanho", shape: "square", radius: "4px", type: "text", values: ["39", "40", "41"] },
    { title: "Cor", shape: "circle", type: "color", values: ["#000", "#333"] },
  ],
  ...overrides,
})

const create = (data) => request(app).post("/v1/product").set(bearer(token)).send(data)

describe("POST /v1/product", () => {
  it("retorna 401 sem token", async () => {
    expect((await request(app).post("/v1/product").send(payload())).status).toBe(401)
  })

  it("cria o produto com categorias, imagens e opções (201)", async () => {
    const res = await create(payload())
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      id: 1,
      enabled: true,
      name: "Tênis Nike",
      slug: "tenis-nike",
      stock: 10,
      price: 200,
      price_with_discount: 150,
      category_ids: [1],
    })
    expect(res.body.images).toHaveLength(1)
    expect(res.body.images[0].content).toMatch(/^http:\/\/localhost:3000\/media\/products\/1\/.+\.png$/)
    expect(res.body.options).toEqual([
      { id: 1, title: "Tamanho", shape: "square", radius: 4, type: "text", values: ["39", "40", "41"] },
      { id: 2, title: "Cor", shape: "circle", radius: 0, type: "color", values: ["#000", "#333"] },
    ])
  })

  it("aplica os valores padrão (enabled=false, stock=0, shape=square, type=text)", async () => {
    const res = await create({ name: "Boné", slug: "bone", price: 50, price_with_discount: 40, options: [{ title: "Tamanho", values: "P,M" }] })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ enabled: false, stock: 0, category_ids: [], images: [] })
    expect(res.body.options[0]).toMatchObject({ shape: "square", radius: 0, type: "text", values: ["P", "M"] })
  })

  it("retorna 400 para dados incorretos", async () => {
    expect((await create(payload({ name: undefined }))).status).toBe(400)
    expect((await create(payload({ price: "abc" }))).status).toBe(400)
    expect((await create(payload({ price_with_discount: undefined }))).status).toBe(400)
    expect((await create(payload({ options: [{ title: "Sem valores" }] }))).status).toBe(400)
    expect((await create(payload({ options: [{ title: "X", shape: "triangle", values: ["a"] }] }))).status).toBe(400)
  })

  it("retorna 400 para categoria inexistente e não cria nada", async () => {
    const res = await create(payload({ category_ids: [1, 999] }))
    expect(res.status).toBe(400)
    expect((await request(app).get("/v1/product/search")).body.total).toBe(0)
  })

  it("retorna 400 para imagem que não é uma imagem de verdade", async () => {
    const fake = Buffer.from("isto nao e uma imagem").toString("base64")
    expect((await create(payload({ images: [{ type: "image/png", content: fake }] }))).status).toBe(400)
    expect((await create(payload({ images: [{ type: "image/png", content: "@@@" }] }))).status).toBe(400)
    expect((await request(app).get("/v1/product/search")).body.total).toBe(0)
  })

  it("salva o arquivo da imagem e o serve em /media", async () => {
    const res = await create(payload())
    const url = new URL(res.body.images[0].content)
    const media = await request(app).get(url.pathname)
    expect(media.status).toBe(200)
    expect(media.headers["content-type"]).toMatch(/image\/png/)
  })
})

describe("GET /v1/product/:id", () => {
  it("retorna 200 com imagens, opções e category_ids, e 404 se não existir", async () => {
    await create(payload({ category_ids: [1, 2] }))
    const ok = await request(app).get("/v1/product/1")
    expect(ok.status).toBe(200)
    expect(ok.body.category_ids.sort()).toEqual([1, 2])
    expect(ok.body.options).toHaveLength(2)
    expect((await request(app).get("/v1/product/99")).status).toBe(404)
  })
})

describe("GET /v1/product/search", () => {
  beforeEach(async () => {
    await create(payload({ name: "Tênis Nike Air", slug: "tenis-nike-air", price: 300, price_with_discount: 250, category_ids: [1], images: [] }))
    await create(payload({ name: "Tênis Adidas", slug: "tenis-adidas", description: "Corrida leve", price: 150, price_with_discount: 0, category_ids: [1], images: [] }))
    await create(payload({ name: "Camiseta Supreme", slug: "camiseta-supreme", description: "Algodão", price: 100, price_with_discount: 80, category_ids: [2], images: [], options: [{ title: "Tamanho", values: ["PP", "GG"] }] }))
  })

  it("usa limit 12 e page 1 por padrão e traz os dados completos", async () => {
    const res = await request(app).get("/v1/product/search")
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ total: 3, limit: 12, page: 1 })
    expect(res.body.data[0]).toHaveProperty("options")
    expect(res.body.data[0]).toHaveProperty("category_ids")
  })

  it("pagina e aceita limit=-1", async () => {
    const page2 = await request(app).get("/v1/product/search?limit=2&page=2")
    expect(page2.body.data).toHaveLength(1)
    expect(page2.body.total).toBe(3)
    expect((await request(app).get("/v1/product/search?limit=-1")).body.data).toHaveLength(3)
  })

  it("match busca no nome e na descrição", async () => {
    const byName = await request(app).get(`/v1/product/search?match=${encodeURIComponent("Tênis")}`)
    expect(byName.body.total).toBe(2)
    const byDescription = await request(app).get("/v1/product/search?match=algod")
    expect(byDescription.body.data.map((p) => p.name)).toEqual(["Camiseta Supreme"])
  })

  it("category_ids filtra pelas categorias", async () => {
    expect((await request(app).get("/v1/product/search?category_ids=2")).body.total).toBe(1)
    expect((await request(app).get("/v1/product/search?category_ids=1,2")).body.total).toBe(3)
  })

  it("price-range considera o preço com desconto quando existir", async () => {
    const res = await request(app).get("/v1/product/search?price-range=100-200")
    expect(res.body.data.map((p) => p.name)).toEqual(["Tênis Adidas"])
  })

  it("option[id] filtra pelos valores da opção", async () => {
    const supreme = (await request(app).get("/v1/product/3")).body
    const optionId = supreme.options[0].id
    const hit = await request(app).get(`/v1/product/search?option[${optionId}]=GG,XG`)
    expect(hit.body.data.map((p) => p.name)).toEqual(["Camiseta Supreme"])
    const miss = await request(app).get(`/v1/product/search?option[${optionId}]=M`)
    expect(miss.body.total).toBe(0)
  })

  it("fields limita os campos retornados", async () => {
    const res = await request(app).get("/v1/product/search?fields=name,price&limit=1")
    expect(res.body.data[0]).toEqual({ name: "Tênis Nike Air", price: 300 })
    const withImages = await request(app).get("/v1/product/search?fields=name,images&limit=1")
    expect(Object.keys(withImages.body.data[0])).toEqual(["name", "images"])
  })

  it("combina filtros", async () => {
    const res = await request(app).get(`/v1/product/search?category_ids=1&match=${encodeURIComponent("Adidas")}`)
    expect(res.body.data.map((p) => p.name)).toEqual(["Tênis Adidas"])
  })

  it("retorna 400 para parâmetros inválidos", async () => {
    for (const query of ["limit=0", "price-range=200-100", "price-range=abc", "category_ids=a,b", "fields=senha"]) {
      expect((await request(app).get(`/v1/product/search?${query}`)).status).toBe(400)
    }
  })
})

describe("PUT /v1/product/:id", () => {
  it("valida token, dados e existência", async () => {
    await create(payload())
    expect((await request(app).put("/v1/product/1").send({ name: "x" })).status).toBe(401)
    expect((await request(app).put("/v1/product/1").set(bearer(token)).send({})).status).toBe(400)
    expect((await request(app).put("/v1/product/1").set(bearer(token)).send({ price: -5 })).status).toBe(400)
    expect((await request(app).put("/v1/product/99").set(bearer(token)).send({ name: "x" })).status).toBe(404)
    expect((await request(app).put("/v1/product/1").set(bearer(token)).send({ category_ids: [999] })).status).toBe(400)
  })

  it("atualiza campos e categorias (204)", async () => {
    await create(payload())
    const res = await request(app)
      .put("/v1/product/1")
      .set(bearer(token))
      .send({ name: "Atualizado", slug: "atualizado", stock: 20, price: 49.9, price_with_discount: 0, category_ids: [2] })
    expect(res.status).toBe(204)
    expect(res.text).toBe("")

    const product = (await request(app).get("/v1/product/1")).body
    expect(product).toMatchObject({ name: "Atualizado", stock: 20, price: 49.9, price_with_discount: 0, category_ids: [2] })
    expect(product.options).toHaveLength(2) 
  })

  it("adiciona, troca e remove imagens", async () => {
    await create(payload({ images: [{ type: "image/png", content: PNG_BASE64 }, { type: "image/png", content: PNG_BASE64 }] }))
    const before = (await request(app).get("/v1/product/1")).body.images
    const oldFile = path.join(process.env.UPLOAD_DIR, new URL(before[0].content).pathname.replace("/media/", ""))
    expect(fs.existsSync(oldFile)).toBe(true)

    const res = await request(app)
      .put("/v1/product/1")
      .set(bearer(token))
      .send({
        images: [
          { type: "image/png", content: PNG_BASE64 },
          { id: before[1].id, deleted: true }, 
          { id: before[0].id, content: PNG_BASE64 }, 
        ],
      })
    expect(res.status).toBe(204)

    const after = (await request(app).get("/v1/product/1")).body.images
    expect(after).toHaveLength(2)
    expect(after.find((i) => i.id === before[0].id).content).not.toBe(before[0].content)
    expect(after.some((i) => i.id === before[1].id)).toBe(false)
    expect(fs.existsSync(oldFile)).toBe(false) 
  })

  it("imagem com content em URL mantém a atual", async () => {
    await create(payload())
    const [image] = (await request(app).get("/v1/product/1")).body.images
    const res = await request(app).put("/v1/product/1").set(bearer(token)).send({ images: [{ id: image.id, content: image.content }] })
    expect(res.status).toBe(204)
    expect((await request(app).get("/v1/product/1")).body.images[0].content).toBe(image.content)
  })

  it("retorna 400 ao mexer em imagem ou opção de outro produto", async () => {
    await create(payload())
    await create(payload({ name: "Outro", slug: "outro" }))
    const other = (await request(app).get("/v1/product/2")).body
    const badImage = await request(app).put("/v1/product/1").set(bearer(token)).send({ images: [{ id: other.images[0].id, deleted: true }] })
    expect(badImage.status).toBe(400)
    const badOption = await request(app).put("/v1/product/1").set(bearer(token)).send({ options: [{ id: other.options[0].id, deleted: true }] })
    expect(badOption.status).toBe(400)
  })

  it("remove, atualiza e cria opções", async () => {
    await create(payload())
    const [size, color] = (await request(app).get("/v1/product/1")).body.options

    const res = await request(app)
      .put("/v1/product/1")
      .set(bearer(token))
      .send({
        options: [
          { id: color.id, deleted: true },
          { id: size.id, radius: "10px", values: ["42/43", "44/45"] },
          { title: "Tipo", shape: "square", type: "text", values: ["100% algodão", "65% algodão"] },
        ],
      })
    expect(res.status).toBe(204)

    const options = (await request(app).get("/v1/product/1")).body.options
    expect(options).toHaveLength(2)
    expect(options.find((o) => o.id === size.id)).toMatchObject({ radius: 10, values: ["42/43", "44/45"], 
      title: "Tamanho" })
    expect(options.find((o) => o.title === "Tipo").values).toEqual(["100% algodão", "65% algodão"])
  })

  it("não deixa arquivo órfão quando a atualização falha", async () => {
    await create(payload({ images: [] }))
    const res = await request(app)
      .put("/v1/product/1")
      .set(bearer(token))
      .send({ images: [{ type: "image/png", content: PNG_BASE64 }], options: [{ id: 999, deleted: true }] })
    expect(res.status).toBe(400)
    expect((await request(app).get("/v1/product/1")).body.images).toHaveLength(0)
  })
})

describe("DELETE /v1/product/:id", () => {
  it("valida token e existência", async () => {
    expect((await request(app).delete("/v1/product/1")).status).toBe(401)
    expect((await request(app).delete("/v1/product/99").set(bearer(token))).status).toBe(404)
  })

  it("remove o produto, suas imagens (inclusive arquivos) e opções (204)", async () => {
    await create(payload())
    const folder = path.join(process.env.UPLOAD_DIR, "products", "1")
    expect(fs.existsSync(folder)).toBe(true)

    expect((await request(app).delete("/v1/product/1").set(bearer(token))).status).toBe(204)
    expect((await request(app).get("/v1/product/1")).status).toBe(404)
    expect(fs.existsSync(folder)).toBe(false)
  })

  it("apagar uma categoria não apaga os produtos dela", async () => {
    await create(payload({ category_ids: [1, 2] }))
    await request(app).delete("/v1/category/1").set(bearer(token))
    const product = (await request(app).get("/v1/product/1")).body
    expect(product.category_ids).toEqual([2])
  })
})

describe("Erros gerais", () => {
  it("rota inexistente retorna 404 e JSON inválido retorna 400", async () => {
    expect((await request(app).get("/v1/nada")).status).toBe(404)
    const res = await request(app).post("/v1/user").set("Content-Type", "application/json").send("{quebrado")
    expect(res.status).toBe(400)
  })

  it("id que não é número retorna 400", async () => {
    expect((await request(app).get("/v1/product/abc")).status).toBe(400)
  })
})
