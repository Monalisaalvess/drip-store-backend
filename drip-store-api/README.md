API REST da Digital Store (back-end do projeto de loja de tênis e acessórios).

**Tecnologias:** 
Node.js, Express, Sequelize (ORM), MySQL, JWT, bcrypt, Joi (validação), Jest + Supertest (testes) e Swagger (documentação).

## Como rodar
Pré-requisitos: **Node.js 18+** e **MySQL 8** (ou MariaDB) rodando na sua máquina.

```bash
# 1. instalar as dependências
npm install

# 2. criar o arquivo de configuração
cp .env.example .env        # no Windows: copy .env.example .env
#    abra o .env e ajuste DB_USER, DB_PASSWORD e JWT_SECRET

# 3. criar o banco, as tabelas e os dados de exemplo
npm run db:create
npm run db:migrate
npm run db:seed

# 4. iniciar a API
npm run dev                 
# ou: npm start
```

A API sobe em `http://localhost:3000` e a **documentação Swagger** fica em `http://localhost:3000/api-docs`.

O seed cria 5 categorias, 8 produtos (com opções de tamanho e cor) e o usuário de teste **`admin@digitalstore.com` / `123456`**.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Inicia com nodemon (reinicia ao salvar) |
| `npm start` | Inicia normalmente |
| `npm test` | Roda os testes (não precisa de MySQL: usam SQLite em memória) |
| `npm run db:create` | Cria o banco definido no `.env` |
| `npm run db:migrate` | Cria/atualiza as tabelas |
| `npm run db:migrate:undo` | Desfaz todas as migrations |
| `npm run db:seed` | Insere os dados de exemplo |
| `npm run db:reset` | Recria as tabelas e os dados de exemplo |

### Variáveis do `.env`

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta da API (padrão 3000) |
| `BASE_URL` | Endereço público da API, usado nos links das imagens |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexão com o MySQL |
| `JWT_SECRET` | Segredo para assinar os tokens (obrigatório) |
| `JWT_EXPIRES_IN` | Validade do token (padrão `1d`) |
| `UPLOAD_DIR` | Pasta das imagens enviadas (padrão `uploads`) |
| `CORS_ORIGIN` | Origem do front-end liberada (ex.: `http://localhost:5173`) |

## Endpoints

Todos começam com `/v1`. Rotas `POST`, `PUT` e `DELETE` exigem `Authorization: Bearer <jwt>`, **exceto** o cadastro de usuário e a geração do token.

| Método | Rota | Descrição | Status |
| --- | --- | --- | --- |
| POST | `/user` | Cadastrar usuário | 201, 400 |
| POST | `/user/token` | Gerar token JWT | 200, 400 |
| GET | `/user/:id` | Buscar usuário | 200, 404 |
| PUT | `/user/:id` | Atualizar usuário | 204, 400, 401, 404 |
| DELETE | `/user/:id` | Deletar usuário | 204, 401, 404 |
| GET | `/category/search` | Listar categorias (`limit`, `page`, `fields`, `use_in_menu`) | 200, 400 |
| GET | `/category/:id` | Buscar categoria | 200, 404 |
| POST | `/category` | Cadastrar categoria | 201, 400, 401 |
| PUT | `/category/:id` | Atualizar categoria | 204, 400, 401, 404 |
| DELETE | `/category/:id` | Deletar categoria | 204, 401, 404 |
| GET | `/product/search` | Listar produtos (`limit`, `page`, `fields`, `match`, `category_ids`, `price-range`, `option[id]`) | 200, 400 |
| GET | `/product/:id` | Buscar produto | 200, 404 |
| POST | `/product` | Criar produto (imagens em base64) | 201, 400, 401 |
| PUT | `/product/:id` | Atualizar produto (imagens e opções) | 204, 400, 401, 404 |
| DELETE | `/product/:id` | Deletar produto | 204, 401, 404 |

Exemplos de busca de produtos:

```
GET /v1/product/search?match=Tênis&category_ids=5&price-range=100-300&limit=8&page=1
GET /v1/product/search?fields=name,images,price
GET /v1/product/search?option[3]=39,40        (opção de id 3 com valor 39 ou 40)
GET /v1/product/search?limit=-1               (todos os itens)
```

## Estrutura (padrão MVC com camada de serviços)

```
src/
├── config/        configurações (env, banco)
├── controllers/   recebem a requisição e devolvem a resposta HTTP
├── services/      regras de negócio e acesso ao banco
├── models/        modelos do Sequelize e relacionamentos
├── routes/        rotas da API
├── middleware/    autenticação JWT, validação e tratamento de erros
├── validations/   schemas Joi de cada endpoint
├── database/      migrations e seeders
├── docs/          documentação Swagger (OpenAPI)
├── utils/         AppError e helpers
├── app.js         configuração do Express
└── server.js      conexão com o banco e início do servidor
tests/             testes automatizados (Jest + Supertest)
```

## Banco de dados

Seis tabelas, criadas por migrations (`src/database/migrations`):

- `users`, `categories` e `products` (com `created_at` e `updated_at`)
- `product_images` e `product_options`: pertencem a um produto (chave estrangeira com `ON DELETE CASCADE`)
- `product_categories`: ligação muitos-para-muitos entre produtos e categorias

Ao apagar um produto, suas imagens (inclusive os arquivos), opções e vínculos são removidos. Ao apagar uma categoria, só os vínculos saem; os produtos continuam.

## Decisões e pontos de atenção

- **Token ausente ou inválido responde `401`.** A especificação cita `401` em cada endpoint e `400` na seção do JWT; usei `401`, que aparece em mais lugares e é o padrão HTTP.
- **Rotas sem token:** `POST /user` e `POST /user/token`, senão ninguém conseguiria criar a primeira conta.
- **Login com dados errados responde `400`** (como o enunciado pede), com mensagem genérica para não revelar se o e-mail existe.
- **Opções do produto:** `values` é guardado como texto separado por vírgula e devolvido como lista. `radius` aceita `4` ou `"4px"`. O apelido `value` também é aceito, pois o exemplo do enunciado usa os dois.
- **Imagens:** chegam em base64, são validadas pelo conteúdo real do arquivo (png, jpg, gif ou webp, até 5 MB), salvas em `uploads/products/<id>/` e servidas em `/media`. No `PUT`, imagem com `content` em URL mantém a atual.
- **`price-range`** usa o preço com desconto quando ele existe (maior que 0); senão, o preço normal.
- **Qualquer usuário autenticado pode editar outros usuários.** O enunciado não restringe isso. Em um sistema real, convém limitar cada pessoa ao próprio cadastro.

## Testes

```bash
npm test
```

56 testes cobrem cadastro, token, CRUD de usuários, categorias e produtos, paginação, filtros, upload e remoção de imagens, cascata de exclusão e códigos de status (200, 201, 204, 400, 401, 404).

***desenvolvido por Monalisa***