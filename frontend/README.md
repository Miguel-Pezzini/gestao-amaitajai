# Frontend

React + Vite, Tailwind CSS, shadcn/ui, React Router e Axios.

## Pré-requisitos

- Node.js 20+
- API em execução (ver [`../backend/README.md`](../backend/README.md))

## Configuração

```powershell
cd frontend
copy .env.example .env
npm install
```

## Desenvolvimento

```powershell
npm run dev
```

Aplicação em `http://localhost:5173`.

## Estrutura

```
src/
  components/ui/   # shadcn/ui
  hooks/
  lib/             # utilitários (ex.: cn)
  pages/           # telas
  routes/          # React Router
  services/        # cliente HTTP (Axios)
```

## shadcn/ui

O projeto já está configurado (`components.json`). Para adicionar componentes:

```powershell
npx shadcn@latest add card
```
