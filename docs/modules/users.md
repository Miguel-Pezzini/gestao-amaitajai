# Módulo: Usuários / Funcionários

**Última atualização:** 2026-06-10  
**Escopo:** fullstack

---

## Visão geral

Gestão de funcionários (usuários do sistema) com perfis `ADMINISTRADOR` ou `TECNICO` e status de conta. Acesso restrito a administradores.

---

## Regras de negócio

### Perfis

- `ADMINISTRADOR`: acesso total, incluindo este módulo.
- `TECNICO`: usuário operacional da agenda.

### Status de conta

`PENDENTE`, `ATIVO`, `INATIVO`. Apenas `ATIVO` (e `PENDENTE` em fluxo Google) autentica.

### Cadastro

- E-mail institucional obrigatório (`@ALLOWED_EMAIL_DOMAIN`).
- Senha mínima 6 caracteres na criação.
- E-mail único no sistema.
- Role default na criação: `TECNICO` se não informado.

---

## Funcionalidades atuais

### Backend — rotas (`/users/*`)

Todas exigem `requireAuth` + `requireAdmin`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/users` | Lista com filtros (search, role, status) e paginação |
| POST | `/users` | Criar funcionário (senha obrigatória) |
| PATCH | `/users/:id` | Atualizar nome, e-mail, senha, role |
| PATCH | `/users/:id/status` | Alterar `accountStatus` |

### Frontend

| Rota | Componente | Descrição |
|---|---|---|
| `/cadastros/funcionarios` | `UsuariosPage` | CRUD de funcionários |

Redirect: `/cadastros/usuarios` → `/cadastros/funcionarios`.

**Paginação:** a listagem consome `page`/`limit` da API (20 itens por página). Resumo `Mostrando X–Y de Z` no cabeçalho; controles Anterior/Próxima via `EntityListPagination` quando há mais de uma página. Nova busca com filtros reinicia na página 1.

---

## Validações importantes

| Campo | Validação | Onde |
|---|---|---|
| `name` | obrigatório | `users.routes.ts` |
| `email` | válido, domínio institucional, único | `users.routes.ts` |
| `password` | ≥6 caracteres (criação ou quando enviado) | `users.routes.ts` |
| `role` | `ADMINISTRADOR` ou `TECNICO` | `users.routes.ts` |
| `accountStatus` | `PENDENTE`, `ATIVO` ou `INATIVO` | `users.routes.ts` |

---

## Permissões

| Ação | administrador | tecnico |
|---|---|---|
| Listar/criar/editar funcionários | sim | não |
| Alterar status de conta | sim | não |

---

## Arquivos principais

| Camada | Caminho |
|---|---|
| Rotas | `backend/src/routes/users.routes.ts` |
| Domínio (roles/status) | `backend/src/domain/agenda.ts` |
| Validator e-mail | `backend/src/validators/auth/email-domain.validator.ts` |
| Schema | `backend/prisma/schema.prisma` (User) |
| Página | `frontend/src/pages/cadastros/UsuariosPage.jsx` |
| Service API | `frontend/src/services/users.js` |
| Guard rota admin | `frontend/src/components/auth/RequireAdminRoute.jsx` |

---

## Pendências e decisões abertas

- Impedir que admin desative a própria conta ou remova o último admin.
- Auditoria de alterações de perfil.

---

## Como testar

Manual:
1. Login como técnico → acessar `/cadastros/funcionarios` → bloqueado.
2. Admin cria funcionário com e-mail duplicado → 409.
3. Admin altera status para `INATIVO` → usuário não consegue mais logar.
