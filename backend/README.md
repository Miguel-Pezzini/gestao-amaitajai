# Backend — API Gestão AMA Itajaí

API REST em **Express 5** e **TypeScript**, com **Prisma** e **PostgreSQL**. Responsável por autenticação, cadastro de pacientes, agenda de sessões e cadastros gerais.

Para contexto do projeto e setup completo, veja o [`README.md`](../README.md) na raiz.

---

## Pré-requisitos

- Node.js 20+
- Docker (PostgreSQL local)

---

## Primeira configuração

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate
npm run db:seed:session-types   # opcional: tipos de sessão iniciais
```

## Desenvolvimento

```bash
npm run dev
```

- Base URL: `http://localhost:3000`
- Health check: `GET /api/health`
- Rotas autenticadas exigem cookie de sessão (definido no login)

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor com hot reload (`tsx watch`) |
| `npm run build` | Gera Prisma Client e compila para `dist/` |
| `npm start` | Executa build de produção |
| `npm run typecheck` | Verifica tipos sem gerar arquivos |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento |
| `npm run db:migrate:deploy` | Aplica migrations (CI/produção) |
| `npm run db:seed:session-types` | Seed de tipos de sessão |
| `npm test` | Sobe Postgres de teste, aplica migrations e roda Vitest |

---

## Estrutura de pastas

```
backend/
├── prisma/
│   ├── schema.prisma      # Modelos e enums
│   └── migrations/        # Histórico SQL
├── src/
│   ├── config/            # env, conexão
│   ├── db/                # Prisma client, serialização (_id)
│   ├── domain/            # Enums e constantes de negócio (agenda)
│   ├── errors/            # AppError e erros HTTP
│   ├── middlewares/       # auth, requireAdmin
│   ├── routes/            # Rotas Express por domínio
│   ├── services/          # Regras de negócio
│   ├── validators/        # Validação de entrada (agenda, etc.)
│   ├── types/             # Augmentação do Express Request
│   ├── app.ts
│   └── index.ts
├── scripts/               # Seeds e utilitários
└── test-with-postgres.sh  # Orquestra testes com Docker
```

### Camadas (como pensar o código)

1. **`routes/`** — recebe HTTP, chama service, trata `AppError`.
2. **`validators/`** — normaliza e valida body/query; lança erro 400 se inválido.
3. **`services/`** — regras de negócio, transações Prisma, conflitos de agenda.
4. **`db/serialize.ts`** — converte `id` do Prisma para `_id` na resposta JSON.

Evite lógica pesada nas rotas; mantenha services focados por domínio.

---

## Rotas principais

Todas abaixo de `/api` (prefixo configurado em `app.ts`).

| Prefixo | Autenticação | Descrição |
|---|---|---|
| `/auth` | Público (login) / autenticado (logout, me) | Sessão JWT em cookie httpOnly |
| `/patients` | Autenticado | CRUD de pacientes |
| `/users` | Admin | Funcionários e perfis |
| `/agenda` | Autenticado | Sessões, lookups, salas, modalidades, tipos |
| `/health` | Público | Status da API |

Detalhes de payload e regras de sessão: [`../docs/MODELAGEM-DADOS-AGENDA.md`](../docs/MODELAGEM-DADOS-AGENDA.md).

### Autorização

- `requireAuth` — usuário logado
- `requireAdmin` — perfil `administrador`

Técnico autenticado acessa agenda, mas o service restringe alterações (ex.: só marca `realizada` na própria sessão).

---

## Modelo de dados (resumo)

Definido em `prisma/schema.prisma`:

| Entidade | Papel |
|---|---|
| `User` | Funcionário (`administrador` \| `tecnico`) |
| `Patient` | Paciente com `FundingSource` |
| `Room` | Sala de atendimento |
| `SessionType` | Tipo (PSICOPED, INTENSIVO, etc.) |
| `Session` | Sessão agendada com status `agendada` \| `realizada` \| `cancelada` |
| `SessionPatient` / `SessionProfessional` | N:N pacientes e profissionais na sessão |
| `SessionModalitySetting` | Limites min/max por modalidade |

---

## Testes

Estrutura na raiz do backend:

```
tests/
├── setup.ts              # env de teste (NODE_ENV=test, TEST_DATABASE_URL)
├── integration/          # API + PostgreSQL (Supertest)
│   ├── helpers/          # createUser, loginAndGetCookie, seedAgendaBase, …
│   ├── auth.test.ts
│   ├── patients.test.ts
│   ├── authorization.test.ts
│   ├── agenda.test.ts
│   └── security.test.ts
└── unit/                 # validators e funções puras (sem Docker)
```

```bash
npm test                  # integração (sobe Postgres de teste) + unit
npm run test:integration  # alias de npm test
npm run test:unit         # só tests/unit/
npm run test:watch        # vitest em modo watch
```

- Integração usa `docker-compose.test.yml` para Postgres isolado (`test-with-postgres.sh`). Arquivos rodam em série (`fileParallelism: false`) por compartilharem o mesmo banco.
- Ao adicionar endpoint com regra de negócio, prefira teste em `tests/integration/` cobrindo sucesso e erro esperado.
- Helpers compartilhados: `tests/integration/helpers/test-helpers.ts`.

---

## PostgreSQL local (Docker)

Parar (mantém dados):

```bash
docker compose down
```

Remover volume de dados:

```bash
docker compose down -v
```

Shell interativo:

```bash
docker compose exec postgres psql -U admin -d gestao_amaitajai
```

(Ajuste usuário e banco conforme seu `.env`.)

---

## Segurança da API

- **Helmet** — headers HTTP padrão (`X-Content-Type-Options`, `X-Frame-Options`, etc.).
- **Rate limit no login** — `POST /api/auth/login` limitado por IP (padrão: 10 tentativas / 15 min). Desativado em `NODE_ENV=test`.
- **Health com banco** — `GET /api/health` retorna `{ status, database }`; responde `503` se o PostgreSQL não responder.
- **Erros centralizados** — middleware global trata `AppError` e oculta detalhes internos em produção.
- **Produção atrás de proxy** — `trust proxy` habilitado quando `NODE_ENV=production` (Railway, etc.) para o rate limit usar o IP real.

## Variáveis de ambiente

Copie `.env.example` para `.env`. Campos típicos:

- `DATABASE_URL` — conexão PostgreSQL
- `JWT_SECRET` — assinatura do token de sessão
- `CORS_ORIGIN` — origem do frontend (ex.: `http://localhost:5173`)
- `PORT` — porta da API (padrão 3000)
- `LOGIN_RATE_LIMIT_MAX` / `LOGIN_RATE_LIMIT_WINDOW_MS` — limite de tentativas de login

---

## Skills para agentes de IA

Convenções específicas deste backend: [`skills/README.md`](skills/README.md).
