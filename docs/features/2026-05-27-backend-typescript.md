# Feature: Migração do backend para TypeScript

**Data:** 27/05/2026

## Objetivo

Migrar o backend de JavaScript para TypeScript, mantendo o frontend em JavaScript.

## Arquivos alterados

- `backend/tsconfig.json` (novo)
- `backend/package.json` (scripts e devDependencies)
- `backend/src/**/*.ts` (substituição de `*.js`)
- `backend/README.md`
- Removidos: `backend/src/**/*.js`

## Regras aplicadas

- Sem mudança de regra de negócio (auth e pacientes permanecem iguais).
- ESM (`"type": "module"`) preservado com `module: NodeNext`.
- Tipagem de `req.user` via `src/types/express.d.ts`.

## Decisões tomadas

- **Dev:** `tsx watch` para hot reload sem build manual.
- **Produção:** `tsc` → `node dist/index.js`.
- Tipos Mongoose com `InferSchemaType` nos models.
- Frontend permanece em JS nesta etapa.

## Pendências

- Adicionar campo `role` (`administrador` | `tecnico`) no model `User` quando iniciar módulo de agenda.
- Avaliar pasta `shared/types` se frontend precisar de contratos tipados depois.

## Como testar manualmente

```bash
cd backend
npm install
npm run typecheck
npm run build
npm run dev
```

1. `GET http://localhost:3000/api/health` → `{ "status": "ok" }`
2. Login e CRUD de pacientes como antes (sem regressão funcional).
