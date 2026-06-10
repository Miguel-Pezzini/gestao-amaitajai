# Módulo: Autenticação

**Última atualização:** 2026-06-10  
**Escopo:** fullstack

---

## Visão geral

Autenticação de usuários via e-mail/senha ou Google OAuth (quando configurado). Sessão mantida em cookie HTTP-only com JWT.

---

## Regras de negócio

### Login por senha

- E-mail e senha obrigatórios.
- Rate limit no endpoint de login.
- Usuário com `accountStatus: INATIVO` não autentica.
- Na primeira subida, cria admin inicial se configurado em env (`ensureInitialAdminUser`).

### Login Google (opcional)

- Habilitado via `GOOGLE_AUTH_ENABLED=true` e credenciais OAuth.
- Apenas e-mails do domínio institucional (`ALLOWED_EMAIL_DOMAIN`).
- Valida `hostedDomain` do token Google quando presente.
- Usuário novo via Google: role `TECNICO`, status `ATIVO`, sem senha.
- Usuário existente: vincula `googleId`, atualiza e-mail se necessário, ativa se `PENDENTE`.
- Conta `INATIVO` → erro `conta_inativa`.

### Sessão

- JWT em cookie (`buildAuthCookieOptions`).
- `/auth/me` retorna usuário serializado (sem senha).
- Logout limpa cookie.

### Deploy (Vercel + Railway, API direta)

Frontend na Vercel chama a API no Railway **sem proxy**. Cookies httpOnly exigem configuração cross-domain:

| Onde | Variável | Valor |
|---|---|---|
| Vercel | `VITE_API_URL` | `https://<railway-host>/api` |
| Railway | `CORS_ORIGIN` | URL exata do frontend (Vercel) |
| Railway | `FRONTEND_URL` | Mesma URL do frontend |
| Railway | `COOKIE_SAME_SITE` | `none` |
| Railway | `GOOGLE_REDIRECT_URI` | `https://<railway-host>/api/auth/google/callback` |
| Google Cloud Console | Authorized redirect URI | Mesmo valor de `GOOGLE_REDIRECT_URI` |

OAuth Google: início (`/auth/google`) e callback (`/auth/google/callback`) rodam no domínio Railway; cookie de state usa `SameSite=lax` (navegação top-level). Após login, o frontend na Vercel consome a API com `withCredentials` e cookie de sessão `SameSite=none`.

---

## Funcionalidades atuais

### Backend — rotas (`/auth/*`)

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/auth/config` | público | Retorna se Google está habilitado e domínio permitido |
| GET | `/auth/google` | público | Redireciona para OAuth Google |
| GET | `/auth/google/callback` | público | Callback OAuth, seta cookie, redireciona ao frontend |
| POST | `/auth/login` | público | Login e-mail/senha |
| POST | `/auth/logout` | público | Limpa sessão |
| GET | `/auth/me` | auth | Usuário logado |

### Frontend

| Rota | Componente | Descrição |
|---|---|---|
| `/login` | `LoginPage` | Formulário senha + botão Google (se habilitado) |

Contexto de sessão: `SessionProvider` / `session-context`.

---

## Validações importantes

| Regra | Onde |
|---|---|
| Domínio de e-mail permitido | `email-domain.validator.ts` |
| Perfil Google completo (email, sub) | `google-auth.service.ts` |
| Conta ativa para autenticar | `auth.service.ts`, `google-auth.service.ts` |
| State cookie no OAuth (CSRF) | `auth.routes.ts` |

---

## Permissões

Módulo transversal — não define roles, apenas identidade. Autorização fica em `requireAdmin` / `requireRole` nos demais módulos.

---

## Arquivos principais

| Camada | Caminho |
|---|---|
| Rotas | `backend/src/routes/auth.routes.ts` |
| Service | `backend/src/services/auth.service.ts` |
| Google OAuth | `backend/src/services/google-auth.service.ts` |
| Validator e-mail | `backend/src/validators/auth/email-domain.validator.ts` |
| Middleware auth | `backend/src/middlewares/auth.middleware.ts` |
| Middleware authz | `backend/src/middlewares/authz.middleware.ts` |
| Página | `frontend/src/pages/LoginPage.jsx` |
| Service API | `frontend/src/services/auth.js` |
| Contexto | `frontend/src/contexts/session-context` |

---

## Pendências e decisões abertas

- Fluxo de convite/aprovação para novos usuários Google (hoje cria `TECNICO` ativo automaticamente).
- Assinatura digital (fase futura).

---

## Como testar

Manual:
1. Login com credenciais válidas → cookie setado, `/auth/me` retorna usuário.
2. Login com senha errada → mensagem genérica (sem vazar se e-mail existe).
3. Google desabilitado → botão oculto; `/auth/google` redireciona com erro.
4. Conta inativa → bloqueio no login.
