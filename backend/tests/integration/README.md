# Testes de integração

Testes que sobem a API Express (`src/app.ts`) e usam PostgreSQL de teste (via `npm test` / `test-with-postgres.sh`).

Padrão de nome: `*.test.ts` (ex.: `auth.test.ts`, `patients.test.ts`).

Helpers compartilhados: `helpers/test-helpers.ts` (`createUser`, `loginAndGetCookie`, `seedAgendaBase`, etc.).

Rodar todos os testes (integração + unitários):

```bash
npm test
```
