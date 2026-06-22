# Testes de integração

Testes que sobem a API Express (`src/app.ts`) e usam PostgreSQL de teste (via `npm test` / `test-with-postgres.sh`).

Padrão de nome: `*.test.ts` (ex.: `auth.test.ts`, `patients.test.ts`).

Helpers compartilhados: `helpers/test-helpers.ts` (`createUser`, `loginAs`, `withAuth`, `seedAgendaBase`, etc.).

### Autenticação nos testes

Os testes de domínio são **agnósticos ao `AUTH_TRANSPORT`** do `.env`:

- `loginAs(email, password)` — extrai o JWT do login (cookie ou body, conforme o transporte).
- `withAuth(request, token)` — envia `Authorization: Bearer <token>` (aceito pelo middleware em ambos os modos).

Testes que validam o **formato do transporte** (cookie no login, token no body, logout) ficam em `auth.test.ts`. Use `loginAndGetCookie` apenas nesses casos. Para forçar um transporte específico, use `withAuthTransport` em `helpers/auth-transport-test.ts`.

Rodar todos os testes (integração + unitários):

```bash
npm test
```
