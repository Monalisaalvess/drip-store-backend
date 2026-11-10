const ref = (name) => ({ $ref: `#/components/schemas/${name}` })
const json = (schema) => ({ "application/json": { schema } })
const error = (description) => ({ description, content: json(ref("Error")) })
const secured = [{ bearerAuth: [] }]
const idParam = { name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }
const responses = {
  badRequest: error("400 - Dados da requisição incorretos"),
  unauthorized: error("401 - Token de autorização não enviado ou inválido"),
  notFound: error("404 - Recurso não encontrado"),
  noContent: { description: "204 - Sucesso, sem corpo de resposta" },
}
const paginationParams = [
  { name: "limit", in: "query", description: "Itens por página. Use -1 para buscar todos.", schema: { type: "integer", default: 12 } },
  { name: "page", in: "query", description: "Página (ignorada quando limit = -1).", schema: { type: "integer", default: 1 } },
]

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Digital Store API",
    version: "1.0.0",
    description:
      "API REST da Digital Store: usuários, categorias e produtos.\n\n" +
      "**Como autenticar:** crie um usuário (`POST /v1/user`), gere o token (`POST /v1/user/token`), clique em **Authorize** e cole o token.\n\n" +
      "Rotas `POST`, `PUT` e `DELETE` exigem token, exceto o cadastro de usuário e a geração do token.",
  },
  servers: [{ url: "/", description: "Servidor atual" }],
  tags: [{ name: "Usuários" }, { name: "Categorias" }, { name: "Produtos" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      Error: {
        type: "object",
        properties: { message: { type: "string" }, details: { type: "array", items: { type: "string" } } },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          firstname: { type: "string", example: "Maria" },
          surname: { type: "string", example: "Silva" },
          email: { type: "string", example: "maria@mail.com" },
        },
      },
      UserCreate: {
        type: "object",
        required: ["firstname", "surname", "email", "password", "confirmPassword"],
        properties: {
          firstname: { type: "string", example: "Maria" },
          surname: { type: "string", example: "Silva" },
          email: { type: "string", example: "maria@mail.com" },
          password: { type: "string", minLength: 6, example: "123@123" },
          confirmPassword: { type: "string", example: "123@123" },
        },
      },
      UserUpdate: {
        type: "object",
        required: ["firstname", "surname", "email"],
        properties: {
          firstname: { type: "string", example: "Maria" },
          surname: { type: "string", example: "Souza" },
          email: { type: "string", example: "maria@mail.com" },
        },
      },
      Login: {
        type: "object",
        required: ["email", "password"],
        properties: { email: { type: "string", example: "maria@mail.com" }, password: { type: "string", example: "123@123" } },
      },
      Token: { type: "object", properties: { token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." } } },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Shoes" },
          slug: { type: "string", example: "shoes" },
          use_in_menu: { type: "boolean", example: true },
        },
      },
      CategoryInput: {
        type: "object",
        required: ["name", "slug"],
        properties: {
          name: { type: "string", example: "Shoes" },
          slug: { type: "string", example: "shoes" },
          use_in_menu: { type: "boolean", example: true },
        },
      },
      CategoryList: {
        type: "object",
        properties: {
          data: { type: "array", items: ref("Category") },
          total: { type: "integer", example: 10 },
          limit: { type: "integer", example: 12 },
          page: { type: "integer", example: 1 },
        },
      },
      ProductOption: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Tamanho" },
          shape: { type: "string", enum: ["square", "circle"], example: "square" },
          radius: { type: "integer", example: 4 },
          type: { type: "string", enum: ["text", "color"], example: "text" },
          values: { type: "array", items: { type: "string" }, example: ["39", "40", "41"] },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          enabled: { type: "boolean", example: true },
          name: { type: "string", example: "Produto 01" },
          slug: { type: "string", example: "produto-01" },
          use_in_menu: { type: "boolean", example: false },
          stock: { type: "integer", example: 10 },
          description: { type: "string", example: "Descrição do produto 01" },
          price: { type: "number", example: 119.9 },
          price_with_discount: { type: "number", example: 99.9 },
          category_ids: { type: "array", items: { type: "integer" }, example: [1, 15] },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: { id: { type: "integer" }, content: { type: "string", example: "http://localhost:3000/media/products/1/imagem.png" } },
            },
          },
          options: { type: "array", items: ref("ProductOption") },
        },
      },
      ProductList: {
        type: "object",
        properties: {
          data: { type: "array", items: ref("Product") },
          total: { type: "integer", example: 120 },
          limit: { type: "integer", example: 12 },
          page: { type: "integer", example: 1 },
        },
      },
      ProductCreate: {
        type: "object",
        required: ["name", "slug", "price", "price_with_discount"],
        properties: {
          enabled: { type: "boolean", example: true },
          name: { type: "string", example: "Produto 01" },
          slug: { type: "string", example: "produto-01" },
          use_in_menu: { type: "boolean", example: false },
          stock: { type: "integer", example: 10 },
          description: { type: "string", example: "Descrição do produto 01" },
          price: { type: "number", example: 119.9 },
          price_with_discount: { type: "number", example: 99.9 },
          category_ids: { type: "array", items: { type: "integer" }, example: [1] },
          images: {
            type: "array",
            description: "Imagens em base64 (png, jpg, gif ou webp, até 5 MB cada)",
            items: {
              type: "object",
              required: ["type", "content"],
              properties: { type: { type: "string", example: "image/png" }, content: { type: "string", example: "iVBORw0KGgo..." } },
            },
          },
          options: {
            type: "array",
            items: {
              type: "object",
              required: ["title", "values"],
              properties: {
                title: { type: "string", example: "Tamanho" },
                shape: { type: "string", enum: ["square", "circle"], example: "square" },
                radius: { type: "string", example: "4px", description: "Número ou texto como 4px" },
                type: { type: "string", enum: ["text", "color"], example: "text" },
                values: { type: "array", items: { type: "string" }, example: ["PP", "M", "GG"] },
              },
            },
          },
        },
      },
      ProductUpdate: {
        type: "object",
        description:
          "Todos os campos são opcionais. Em `images` e `options`: item com `{ id, deleted: true }` remove; " +
          "com `id` e novos dados atualiza; sem `id` cria. Imagem com `content` em URL mantém a atual.",
        properties: {
          enabled: { type: "boolean" },
          name: { type: "string", example: "Produto 01 atualizado" },
          slug: { type: "string", example: "produto-01-atualizado" },
          stock: { type: "integer", example: 20 },
          description: { type: "string" },
          price: { type: "number", example: 49.9 },
          price_with_discount: { type: "number", example: 0 },
          category_ids: { type: "array", items: { type: "integer" }, example: [1, 2] },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer", example: 2 },
                deleted: { type: "boolean", example: true },
                type: { type: "string", example: "image/png" },
                content: { type: "string", example: "base64 ou URL" },
              },
            },
          },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer", example: 2 },
                deleted: { type: "boolean" },
                title: { type: "string" },
                shape: { type: "string", enum: ["square", "circle"] },
                radius: { type: "string", example: "10px" },
                type: { type: "string", enum: ["text", "color"] },
                values: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    // Usuários
    "/v1/user": {
      post: {
        tags: ["Usuários"],
        summary: "Cadastrar usuário",
        requestBody: { required: true, content: json(ref("UserCreate")) },
        responses: { 201: { description: "201 - Usuário criado", content: json(ref("User")) }, 400: responses.badRequest },
      },
    },
    "/v1/user/token": {
      post: {
        tags: ["Usuários"],
        summary: "Gerar token JWT",
        requestBody: { required: true, content: json(ref("Login")) },
        responses: { 200: { description: "200 - Token gerado", content: json(ref("Token")) }, 400: responses.badRequest },
      },
    },
    "/v1/user/{id}": {
      get: {
        tags: ["Usuários"],
        summary: "Buscar usuário pelo ID",
        parameters: [idParam],
        responses: { 200: { description: "200 - Usuário", content: json(ref("User")) }, 404: responses.notFound },
      },
      put: {
        tags: ["Usuários"],
        summary: "Atualizar usuário",
        security: secured,
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("UserUpdate")) },
        responses: { 204: responses.noContent, 400: responses.badRequest, 401: responses.unauthorized, 404: responses.notFound },
      },
      delete: {
        tags: ["Usuários"],
        summary: "Deletar usuário",
        security: secured,
        parameters: [idParam],
        responses: { 204: responses.noContent, 401: responses.unauthorized, 404: responses.notFound },
      },
    },

    // Categorias
    "/v1/category/search": {
      get: {
        tags: ["Categorias"],
        summary: "Listar categorias",
        parameters: [
          ...paginationParams,
          { name: "fields", in: "query", description: "Campos retornados, separados por vírgula", schema: { type: "string", example: "name,slug" } },
          { name: "use_in_menu", in: "query", description: "Filtra categorias que aparecem no menu", schema: { type: "boolean" } },
        ],
        responses: { 200: { description: "200 - Lista paginada", content: json(ref("CategoryList")) }, 400: responses.badRequest },
      },
    },
    "/v1/category": {
      post: {
        tags: ["Categorias"],
        summary: "Cadastrar categoria",
        security: secured,
        requestBody: { required: true, content: json(ref("CategoryInput")) },
        responses: { 201: { description: "201 - Categoria criada", content: json(ref("Category")) }, 400: responses.badRequest, 401: responses.unauthorized },
      },
    },
    "/v1/category/{id}": {
      get: {
        tags: ["Categorias"],
        summary: "Buscar categoria pelo ID",
        parameters: [idParam],
        responses: { 200: { description: "200 - Categoria", content: json(ref("Category")) }, 404: responses.notFound },
      },
      put: {
        tags: ["Categorias"],
        summary: "Atualizar categoria",
        security: secured,
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("CategoryInput")) },
        responses: { 204: responses.noContent, 400: responses.badRequest, 401: responses.unauthorized, 404: responses.notFound },
      },
      delete: {
        tags: ["Categorias"],
        summary: "Deletar categoria",
        security: secured,
        parameters: [idParam],
        responses: { 204: responses.noContent, 401: responses.unauthorized, 404: responses.notFound },
      },
    },

    //  Produtos 
    "/v1/product/search": {
      get: {
        tags: ["Produtos"],
        summary: "Listar produtos com filtros",
        parameters: [
          ...paginationParams,
          { name: "fields", in: "query", description: "Campos retornados (ex.: name,images,price)", schema: { type: "string", example: "name,images,price" } },
          { name: "match", in: "query", description: "Termo do nome ou da descrição", schema: { type: "string", example: "Tênis" } },
          { name: "category_ids", in: "query", description: "IDs das categorias, separados por vírgula", schema: { type: "string", example: "15,24" } },
          { name: "price-range", in: "query", description: "Faixa de preço min-max", schema: { type: "string", example: "100-200" } },
          {
            name: "option[45]",
            in: "query",
            description: "Valores da opção de id 45, separados por vírgula. Troque 45 pelo id da opção.",
            schema: { type: "string", example: "GG,PP" },
          },
        ],
        responses: { 200: { description: "200 - Lista paginada", content: json(ref("ProductList")) }, 400: responses.badRequest },
      },
    },
    "/v1/product": {
      post: {
        tags: ["Produtos"],
        summary: "Criar produto",
        security: secured,
        requestBody: { required: true, content: json(ref("ProductCreate")) },
        responses: { 201: { description: "201 - Produto criado", content: json(ref("Product")) }, 400: responses.badRequest, 401: responses.unauthorized },
      },
    },
    "/v1/product/{id}": {
      get: {
        tags: ["Produtos"],
        summary: "Buscar produto pelo ID",
        parameters: [idParam],
        responses: { 200: { description: "200 - Produto", content: json(ref("Product")) }, 404: responses.notFound },
      },
      put: {
        tags: ["Produtos"],
        summary: "Atualizar produto",
        security: secured,
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("ProductUpdate")) },
        responses: { 204: responses.noContent, 400: responses.badRequest, 401: responses.unauthorized, 404: responses.notFound },
      },
      delete: {
        tags: ["Produtos"],
        summary: "Deletar produto",
        security: secured,
        parameters: [idParam],
        responses: { 204: responses.noContent, 401: responses.unauthorized, 404: responses.notFound },
      },
    },
  },
}
