# Backend

API Express com PostgreSQL (Prisma), escrita em **TypeScript**.

## Pré-requisitos

- Node.js 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (PostgreSQL local)

## Configuração

```powershell
cd backend
copy .env.example .env
npm install
docker compose up -d
npm run db:migrate
```

## Desenvolvimento

```powershell
npm run dev
```

API em `http://localhost:3000` · health check: `GET /api/health`

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor com hot reload (`tsx watch`) |
| `npm run build` | Gera Prisma Client e compila para `dist/` |
| `npm start` | Executa build de produção |
| `npm run typecheck` | Verifica tipos sem gerar arquivos |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento |
| `npm run db:migrate:deploy` | Aplica migrations (CI/produção) |
| `npm test` | Sobe Postgres de teste, aplica migrations e roda Vitest |

## Estrutura

```
prisma/          # schema e migrations
src/
  config/        # variáveis de ambiente e conexão
  db/            # Prisma client e serialização da API (_id)
  domain/        # enums e constantes de negócio
  middlewares/   # autenticação
  routes/        # rotas HTTP
  services/      # regras de negócio
  validators/    # validação de entrada
  types/         # declarações TypeScript (ex.: Express Request)
  app.ts         # Express
  index.ts       # entrada
dist/            # saída do `tsc` (gerado)
```

## PostgreSQL local (Docker)

Parar (mantém dados): `docker compose down`  
Remover dados: `docker compose down -v`

### Shell do Postgres

```powershell
docker compose exec postgres psql -U admin -d gestao_amaitajai
```

(Ajuste usuário e senha conforme o seu `.env`.)
