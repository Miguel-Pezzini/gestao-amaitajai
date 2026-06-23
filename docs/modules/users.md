# Módulo: Usuários / Funcionários

**Última atualização:** 2026-06-23  
**Escopo:** fullstack

---

## Terminologia

Na **interface**, este módulo aparece como **Funcionários** (Cadastros gerais). No **código**, a entidade é `User` (`/users`). Não confundir com **usuário atendido** pela ONG — na UI do módulo de cadastro clínico (`Patient`, `/patients`); ver [`patients.md`](./patients.md).

---

## Visão geral

Gestão de funcionários (usuários do sistema) com perfis `ADMINISTRADOR`, `TECNICO`, `RECEPCAO` ou `OPERADOR` e status de conta. Acesso restrito a administradores.

---

## Regras de negócio

### Perfis

- `ADMINISTRADOR`: acesso total, incluindo este módulo.
- `TECNICO`: usuário operacional da agenda.
- `RECEPCAO`: usuário de recepção com acesso à agenda (leitura de todas as sessões), abertura e consulta de protocolos (sem concluir/cancelar), PDV de vendas (cantina/eventos, fiados) e sem dados clínicos de pacientes.
- `OPERADOR`: usuário de vendas (cantina/eventos) com acesso exclusivo ao módulo Vendas; sem acesso a agenda, pacientes ou protocolos clínicos.

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
| `role` | `ADMINISTRADOR`, `TECNICO`, `RECEPCAO` ou `OPERADOR` | `users.routes.ts` |
| `accountStatus` | `PENDENTE`, `ATIVO` ou `INATIVO` | `users.routes.ts` |

---

## Permissões

| Ação | administrador | tecnico | recepcao | operador |
|---|---|---|---|---|
| Listar/criar/editar funcionários | sim | não | não | não |
| Alterar status de conta | sim | não | não | não |

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
| Guard rota por perfis | `frontend/src/components/auth/RequireRolesRoute.jsx` |

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
