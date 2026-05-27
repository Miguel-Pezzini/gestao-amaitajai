# Backend

API Express com MongoDB (Mongoose), escrita em **TypeScript**.

## Pré-requisitos

- Node.js 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (MongoDB local)

## Configuração

```powershell
cd backend
copy .env.example .env
npm install
docker compose up -d
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
| `npm run build` | Compila para `dist/` |
| `npm start` | Executa build de produção |
| `npm run typecheck` | Verifica tipos sem gerar arquivos |

## Estrutura

```
src/
  config/        # variáveis de ambiente e conexão MongoDB
  middlewares/   # autenticação
  models/        # schemas Mongoose
  routes/        # rotas HTTP
  services/      # regras de negócio
  types/         # declarações TypeScript (ex.: Express Request)
  app.ts         # Express
  index.ts       # entrada
dist/            # saída do `tsc` (gerado)
```

## MongoDB local (Docker)

Parar (mantém dados): `docker compose down`  
Remover dados: `docker compose down -v`

### Shell do Mongo

```powershell
docker compose exec mongodb mongosh -u admin -p changeme --authenticationDatabase admin gestao_amaitajai
```

(Ajuste usuário e senha conforme o seu `.env`.)
