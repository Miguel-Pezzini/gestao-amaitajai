# Backend

API Express.js com MongoDB (Mongoose).

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

## Estrutura

```
src/
  config/        # variáveis de ambiente e conexão MongoDB
  controllers/   # (reservado)
  middleware/    # (reservado)
  models/        # (reservado)
  routes/        # rotas HTTP
  app.js         # Express
  index.js       # entrada
```

## MongoDB local (Docker)

Parar (mantém dados): `docker compose down`  
Remover dados: `docker compose down -v`

### Shell do Mongo

```powershell
docker compose exec mongodb mongosh -u admin -p changeme --authenticationDatabase admin gestao_amaitajai
```

(Ajuste usuário e senha conforme o seu `.env`.)
