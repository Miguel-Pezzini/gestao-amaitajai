# Gestão AMA Itajaí

Sistema web para gestão institucional da AMA Itajaí (projeto de extensão UNIVALI).

**Documentação:** [`PROJETO-EXTENSAO.md`](PROJETO-EXTENSAO.md) · [`REQUISITOS.md`](REQUISITOS.md) · [`TODO.md`](TODO.md)

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React, Vite, Tailwind CSS, shadcn/ui, React Router, Axios |
| Backend | Express.js, Mongoose |
| Banco | MongoDB (Docker Compose em `backend/`) |

## Pré-requisitos

- Node.js 20+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Setup rápido

### 1. Banco de dados

```powershell
cd backend
copy .env.example .env
docker compose up -d
```

### 2. API

```powershell
cd backend
npm install
npm run dev
```

### 3. Interface

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

- API: `http://localhost:3000`
- App: `http://localhost:5173`

Detalhes em [`backend/README.md`](backend/README.md) e [`frontend/README.md`](frontend/README.md).
