const { request, app, createUserAndToken, bearer, resetDatabase, closeDatabase } = require("./helpers")

let token
beforeEach(async () => {
  await resetDatabase()
  token = (await createUserAndToken()).token
})
afterAll(closeDatabase)

const create = (data) => request(app).post("/v1/category").set(bearer(token)).send(data)

describe("POST /v1/category", () => {
  it("retorna 401 sem token", async () => {
    expect((await request(app).post("/v1/category").send({ name: "Shoes", slug: "shoes" })).status).toBe(401)
  })

  it("cria a categoria (201) com use_in_menu padrão false", async () => {
    const res = await create({ name: "Shoes", slug: "shoes" })
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: 1, name: "Shoes", slug: "shoes", use_in_menu: false })
  })

  it("retorna 400 para dados incorretos", async () => {
    expect((await create({ slug: "shoes" })).status).toBe(400)
    expect((await create({ name: "Shoes", slug: "Slug Inválido" })).status).toBe(400)
    expect((await create({ name: "Shoes", slug: "shoes", use_in_menu: "talvez" })).status).toBe(400)
  })
})

describe("GET /v1/category/:id", () => {
  it("retorna 200 e 404", async () => {
    await create({ name: "Shoes", slug: "shoes", use_in_menu: true })
    const ok = await request(app).get("/v1/category/1")
    expect(ok.status).toBe(200)
    expect(ok.body).toEqual({ id: 1, name: "Shoes", slug: "shoes", use_in_menu: true })
    expect((await request(app).get("/v1/category/99")).status).toBe(404)
  })
})

describe("GET /v1/category/search", () => {
  beforeEach(async () => {
    for (let i = 1; i <= 15; i++) {
      await create({ name: `Categoria ${i}`, slug: `categoria-${i}`, use_in_menu: i % 3 === 0 })
    }
  })

  it("usa limit 12 e page 1 por padrão", async () => {
    const res = await request(app).get("/v1/category/search")
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ total: 15, limit: 12, page: 1 })
    expect(res.body.data).toHaveLength(12)
  })

  it("pagina com limit e page", async () => {
    const res = await request(app).get("/v1/category/search?limit=10&page=2")
    expect(res.body.data).toHaveLength(5)
    expect(res.body.data[0].id).toBe(11)
  })

  it("limit=-1 retorna todos os itens", async () => {
    const res = await request(app).get("/v1/category/search?limit=-1")
    expect(res.body.data).toHaveLength(15)
    expect(res.body.limit).toBe(-1)
  })

  it("fields limita as colunas retornadas", async () => {
    const res = await request(app).get("/v1/category/search?fields=name,slug&limit=1")
    expect(res.body.data[0]).toEqual({ name: "Categoria 1", slug: "categoria-1" })
  })

  it("use_in_menu=true filtra as categorias do menu", async () => {
    const res = await request(app).get("/v1/category/search?use_in_menu=true&limit=-1")
    expect(res.body.total).toBe(5)
    expect(res.body.data.every((c) => c.use_in_menu === true)).toBe(true)
  })

  it("retorna 400 para parâmetros inválidos", async () => {
    expect((await request(app).get("/v1/category/search?limit=0")).status).toBe(400)
    expect((await request(app).get("/v1/category/search?page=abc")).status).toBe(400)
    expect((await request(app).get("/v1/category/search?fields=senha")).status).toBe(400)
  })
})

describe("PUT e DELETE /v1/category/:id", () => {
  it("atualiza (204), validando token, dados e existência", async () => {
    await create({ name: "Shoes", slug: "shoes" })
    const body = { name: "Tênis", slug: "tenis", use_in_menu: true }

    expect((await request(app).put("/v1/category/1").send(body)).status).toBe(401)
    expect((await request(app).put("/v1/category/1").set(bearer(token)).send({ name: "x" })).status).toBe(400)
    expect((await request(app).put("/v1/category/99").set(bearer(token)).send(body)).status).toBe(404)

    const res = await request(app).put("/v1/category/1").set(bearer(token)).send(body)
    expect(res.status).toBe(204)
    expect((await request(app).get("/v1/category/1")).body).toEqual({ id: 1, ...body })
  })

  it("remove (204), validando token e existência", async () => {
    await create({ name: "Shoes", slug: "shoes" })
    expect((await request(app).delete("/v1/category/1")).status).toBe(401)
    expect((await request(app).delete("/v1/category/99").set(bearer(token))).status).toBe(404)
    expect((await request(app).delete("/v1/category/1").set(bearer(token))).status).toBe(204)
    expect((await request(app).get("/v1/category/1")).status).toBe(404)
  })
})
