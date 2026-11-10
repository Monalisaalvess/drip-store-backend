const { request, app, validUser, createUserAndToken, bearer, resetDatabase, closeDatabase } = require("./helpers")
const { User } = require("../src/models")

beforeEach(resetDatabase)
afterAll(closeDatabase)

describe("POST /v1/user (cadastro)", () => {
  it("cria o usuário e responde 201 sem expor a senha", async () => {
    const res = await request(app).post("/v1/user").send(validUser)
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: 1, firstname: "Maria", surname: "Silva", email: "maria@mail.com" })
  })

  it("guarda o hash da senha (bcrypt), não a senha pura", async () => {
    await request(app).post("/v1/user").send(validUser)
    const saved = await User.findOne({ where: { email: validUser.email } })
    expect(saved.password).not.toBe(validUser.password)
    expect(saved.password).toMatch(/^\$2[aby]\$/)
  })

  it("responde 400 quando confirmPassword é diferente", async () => {
    const res = await request(app).post("/v1/user").send({ ...validUser, confirmPassword: "outra" })
    expect(res.status).toBe(400)
  })

  it("responde 400 para e-mail inválido ou campo faltando", async () => {
    expect((await request(app).post("/v1/user").send({ ...validUser, email: "nao-e-email" })).status).toBe(400)
    expect((await request(app).post("/v1/user").send({ ...validUser, firstname: undefined })).status).toBe(400)
  })

  it("responde 400 para e-mail já cadastrado", async () => {
    await request(app).post("/v1/user").send(validUser)
    const res = await request(app).post("/v1/user").send(validUser)
    expect(res.status).toBe(400)
  })
})

describe("GET /v1/user/:id", () => {
  it("retorna 200 com os dados do usuário", async () => {
    const { id } = await createUserAndToken()
    const res = await request(app).get(`/v1/user/${id}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id, firstname: "Maria", surname: "Silva", email: "maria@mail.com" })
  })

  it("retorna 404 quando não existe", async () => {
    expect((await request(app).get("/v1/user/999")).status).toBe(404)
  })
})

describe("POST /v1/user/token", () => {
  it("retorna 200 e o token JWT", async () => {
    await request(app).post("/v1/user").send(validUser)
    const res = await request(app).post("/v1/user/token").send({ email: validUser.email, password: validUser.password })
    expect(res.status).toBe(200)
    expect(res.body.token.split(".")).toHaveLength(3)
  })

  it("retorna 400 para senha errada, e-mail inexistente ou dados faltando", async () => {
    await request(app).post("/v1/user").send(validUser)
    expect((await request(app).post("/v1/user/token").send({ email: validUser.email, password: "errada" })).status).toBe(400)
    expect((await request(app).post("/v1/user/token").send({ email: "x@mail.com", password: "123456" })).status).toBe(400)
    expect((await request(app).post("/v1/user/token").send({})).status).toBe(400)
  })
})

describe("PUT /v1/user/:id", () => {
  const body = { firstname: "Ana", surname: "Souza", email: "ana@mail.com" }

  it("retorna 401 sem token ou com token inválido", async () => {
    expect((await request(app).put("/v1/user/1").send(body)).status).toBe(401)
    expect((await request(app).put("/v1/user/1").set(bearer("token-invalido")).send(body)).status).toBe(401)
  })

  it("atualiza e retorna 204 sem corpo", async () => {
    const { id, token } = await createUserAndToken()
    const res = await request(app).put(`/v1/user/${id}`).set(bearer(token)).send(body)
    expect(res.status).toBe(204)
    expect(res.text).toBe("")
    expect((await request(app).get(`/v1/user/${id}`)).body.firstname).toBe("Ana")
  })

  it("retorna 400 para dados incorretos e 404 para usuário inexistente", async () => {
    const { id, token } = await createUserAndToken()
    expect((await request(app).put(`/v1/user/${id}`).set(bearer(token)).send({ ...body, email: "x" })).status).toBe(400)
    expect((await request(app).put("/v1/user/999").set(bearer(token)).send(body)).status).toBe(404)
  })
})

describe("DELETE /v1/user/:id", () => {
  it("retorna 401 sem token", async () => {
    expect((await request(app).delete("/v1/user/1")).status).toBe(401)
  })

  it("remove e retorna 204; depois o usuário não existe mais", async () => {
    const { id, token } = await createUserAndToken()
    expect((await request(app).delete(`/v1/user/${id}`).set(bearer(token))).status).toBe(204)
    expect((await request(app).get(`/v1/user/${id}`)).status).toBe(404)
  })

  it("retorna 404 para usuário inexistente", async () => {
    const { token } = await createUserAndToken()
    expect((await request(app).delete("/v1/user/999").set(bearer(token))).status).toBe(404)
  })
})
