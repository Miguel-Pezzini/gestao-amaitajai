---
  Guia de arquitetura e padrão de desenvolvimento do Gestão AMA Itajaí.
  Use ao implementar features ou fixes para manter o estilo legado do código
  com mudanças pequenas e localizadas — sem refactors amplos nem novas abstrações.
name: gestao-amaitajai-engineer
model: inherit
description: >-
is_background: true
---

# Gestão AMA Itajaí Engineer Agent

## Objetivo

Orientar agentes de IA (e desenvolvedores) a modificar o repositório **gestao-amaitajai** respeitando a arquitetura e os padrões **já existentes**.

Este projeto é um monorepo com:

- **Backend:** Express 5, TypeScript, Prisma, PostgreSQL (`backend/`)
- **Frontend:** React, Vite, JavaScript/JSX, Tailwind, componentes shadcn-style (`frontend/`)

Não há camada de repositório, nem Symfony/PHP, nem ORM além do Prisma. Não invente camadas que o código não usa.

Antes de qualquer alteração funcional:

1. Identifique o **módulo** (agenda, patients, auth, users, cadastros, room-occupancy, protocols, vendas).
2. Leia `docs/modules/<modulo>.md` (índice em `docs/modules/README.md`).
3. Leia as skills do escopo: `backend/skills/README.md` e/ou `frontend/skills/README.md`.
4. Siga `AGENTS.md` na raiz para TDD e validações finais.

## Princípios

Filosofia herdada de `minimal-engineer.md`, adaptada a este projeto:

- **Mudança mínima correta** — pergunte: "dá para resolver alterando o código existente?"
- **Siga o legado** — dois estilos coexistem (rotas finas vs. rotas com validação inline). Copie o arquivo mais parecido com o que você está tocando.
- **Sem refactors amplos** — não reorganize pastas, não introduza repositories, DTOs, facades ou clean architecture sem pedido explícito.
- **Sem abstrações prematuras** — não crie helper, hook ou service novo para uso único.
- **Reutilize antes de duplicar** — procure função, validator ou serializer existente no mesmo domínio.
- **Mantenha compatibilidade de API** — respostas JSON usam `_id` (legado Mongo); rotas em `/api`; mensagens de erro em `{ message }`.
- **Documente o que mudou** — atualize `docs/modules/<modulo>.md` na mesma entrega de qualquer alteração funcional.

## Arquitetura do Projeto

### Visão geral

```
gestao-amaitajai/
├── backend/
│   ├── prisma/schema.prisma    # modelos e enums
│   ├── src/
│   │   ├── app.ts              # Express + middlewares globais
│   │   ├── routes/             # HTTP por domínio (*.routes.ts)
│   │   ├── services/           # regras de negócio + Prisma
│   │   ├── validators/         # validação de entrada por domínio
│   │   ├── domain/             # enums, constantes, funções puras de negócio
│   │   ├── db/                 # prisma client, serialize (_id), errors Prisma
│   │   ├── errors/             # AppError + subclasses HTTP
│   │   ├── middlewares/        # auth, authz, asyncHandler, errorHandler
│   │   ├── config/             # env, database
│   │   └── types/              # augmentação Express (req.user)
│   └── tests/
│       ├── integration/        # Supertest + Postgres de teste
│       └── unit/               # validators e funções puras
├── frontend/
│   └── src/
│       ├── pages/              # composição de telas
│       ├── features/<modulo>/  # componentes, hooks e utils por feature
│       ├── hooks/              # orquestração de páginas (useXxxPage.js)
│       ├── services/           # chamadas Axios à API
│       ├── components/         # UI compartilhada (ui/, auth/, cadastros/)
│       ├── config/             # modules.js, cadastros.js (menu)
│       ├── routes/AppRoutes.jsx
│       ├── contexts/           # sessão, toast
│       └── lib/                # auth-session, api-error, etc.
└── docs/modules/               # fonte de verdade por módulo
```

### Camadas backend (fluxo real)

1. **`routes/`** — recebe HTTP, aplica `requireAuth` / `requireAdmin` / `requireRole`, chama service ou Prisma, retorna JSON.
2. **`validators/`** — normaliza e valida body/query; lança `ValidationError` (400).
3. **`services/`** — orquestra regras de negócio, transações Prisma, conflitos, permissões por contexto.
4. **`domain/`** — constantes de enum, labels, funções puras sem I/O (ex.: `buildPatientDeactivatedCancelReason`).
5. **`db/serialize.ts`** — converte `id` do Prisma para `_id` nas respostas (compatibilidade legada com frontend antigo).

**Não existe** pasta `repositories/`. Consultas Prisma ficam no service (ou, em módulos CRUD simples, diretamente na rota).

### Dois estilos de rota (ambos válidos — não unifique)

| Estilo | Onde | Padrão |
|---|---|---|
| **Rota fina** | `agenda.routes.ts`, `patient-evolutions.routes.ts`, `protocols.routes.ts` | `asyncHandler` → `service.metodo()` → `res.json()` |
| **Rota com lógica** | `patients.routes.ts`, `users.routes.ts` | validação inline no arquivo da rota, Prisma direto, `serialize*` local |

Ao adicionar endpoint em módulo existente, **copie o estilo do arquivo de rotas desse módulo**. Não migre um para o outro "por limpeza".

### Services

- Classe por domínio (`AgendaService`, `ProtocolService`, …) exportada como **singleton**: `export const agendaService = new AgendaService()`.
- Arquivos auxiliares com sufixo `.helpers.ts` quando a lógica é compartilhada dentro do domínio (ex.: `session-recurrence.helpers.ts`, `patient-deactivation.helpers.ts`).
- Método público ideal: validar → carregar → aplicar regra → persistir → retornar (&lt; 25 linhas de orquestração).
- Erros de negócio: `ValidationError`, `NotFoundError`, `ConflictError`, `ForbiddenError` em `errors/http-errors.ts`.

### Entidades / modelos

- **Prisma** (`prisma/schema.prisma`) é a fonte de verdade do banco.
- **`domain/`** guarda enums espelhados (`USER_ROLES`, `SESSION_STATUSES`, …) e helpers sem dependência de Prisma — não é camada de entidade rica.
- Não crie classes de modelo paralelas ao Prisma.

### Frontend

- **Páginas** (`pages/`) compõem layout; lógica pesada em **hooks** (`hooks/useAgendaPage.js`) ou hooks de feature (`features/agenda/hooks/`).
- **Services** (`services/*.js`) — uma função por operação de API; usam `api` (Axios) ou `getOnce` para GET deduplicado.
- **Features** (`features/<modulo>/components/`, `constants.js`, `utils.js`) — UI e helpers do domínio.
- **Rotas** — `routes/AppRoutes.jsx` + guards (`RequireAdminRoute`, `RequireRolesRoute`, `RequireSalesRoute`).
- **Menu** — `config/modules.js`, `config/cadastros.js`.
- Componentes UI base em `components/ui/` (Button, Dialog, Card, …).

### Terminologia (UI vs código)

| Conceito na UI | Código / API |
|---|---|
| **Usuário** (atendido pela ONG) | `Patient`, `/patients`, `patientId` |
| **Funcionário** (login no sistema) | `User`, `/users` |
| **Localizar usuário** | rota `/agenda/localizar-atendido`, componente `AgendaPatientLocatorPage` |

Mensagens exibidas ao usuário usam **usuário**; identificadores de código permanecem `patient*`.

### Tratamento de erros

**Backend:**

- Validators e services lançam subclasses de `AppError`.
- Rotas finas delegam ao `errorHandler` global via `asyncHandler` (`.catch(next)`).
- Rotas com lógica inline respondem manualmente: `res.status(400).json({ message: errors.join(" ") })`.
- Resposta padrão de erro: `{ message: string, code?: string }`.

**Frontend:**

- `getApiErrorMessage(err, fallback)` em `lib/api-error.js` lê `error.response.data.message`.
- Toasts e `InlineAlert` exibem a mensagem da API quando disponível.

### Permissões

**Backend** (`middlewares/authz.middleware.ts`):

- `requireAuth` — JWT (cookie ou Bearer conforme `auth-transport`).
- `requireAdmin`, `requireClinicalOperator`, `requireProtocolRequester`, `requireSalesOperator` — composições de `requireRole(...)`.
- Regras finas (ex.: técnico só conclui própria sessão) ficam **no service**, não só no middleware.

**Frontend:**

- Guards de rota espelham perfis do backend.
- Esconder botão na UI **não substitui** validação no backend.

### Consultas ao banco

- Cliente único: `db/prisma.ts`.
- Preferir `select` / `include` explícitos; reutilizar constantes de include no topo do arquivo (ex.: `patientInclude` em `patients.routes.ts`).
- Transações: `prisma.$transaction` no service quando há múltiplas escritas.
- Migrations: `backend/prisma/migrations/` — nunca editar migration já aplicada; criar nova.
- Testes de integração usam `useIntegrationTestDatabase()` e rodam com Postgres Docker.

### Integração frontend ↔ backend

- Base URL: `VITE_API_URL` → `/api`.
- Credenciais: `withCredentials: true` (cookies httpOnly).
- IDs na resposta: `_id` — frontend envia de volta como parâmetro de rota ou body conforme contrato existente.
- Um arquivo `services/<dominio>.js` por área de API; páginas e hooks importam de lá, não chamam Axios direto.
- Após mudar contrato de API, ajustar service frontend + tipos/consumo na página/hook correspondente.

## Como Fazer Alterações

### Fluxo obrigatório (TDD)

1. Definir cenário de aceitação (sucesso + erros esperados).
2. Escrever/ajustar teste (backend: `tests/integration/` ou `tests/unit/`).
3. Confirmar falha (red).
4. Implementar a **menor** mudança (green).
5. Rodar validações: `npm test` + `npm run typecheck` (backend), `npm run build` (frontend).
6. Atualizar `docs/modules/<modulo>.md`.

### Onde colocar cada tipo de lógica

| O quê | Onde |
|---|---|
| Nova regra que depende de estado no banco | `services/<dominio>.service.ts` |
| Validação de formato/campos do body ou query | `validators/<dominio>/` (função `validate*`) |
| Constante ou enum de negócio | `domain/<dominio>.ts` |
| Serialização JSON (`_id`, refs populadas) | `db/serialize.ts` ou função `serialize*` no service |
| Novo endpoint HTTP | `routes/<dominio>.routes.ts` + registro em `routes/index.ts` |
| Nova tela ou fluxo UI | `pages/` + `features/<modinio>/` + `services/` + `AppRoutes.jsx` |
| Texto exibido ao usuário | componentes frontend; mensagens de API em português claro |

### Quando alterar cada camada

| Camada | Altere quando… | Não altere quando… |
|---|---|---|
| **Route** | novo endpoint, middleware de auth, status HTTP, delegação | a regra é só de negócio reutilizável |
| **Service** | regra de negócio, transação, conflito, permissão contextual | só mudou label da UI |
| **Validator** | novo campo obrigatório, formato, limites de entrada | a regra precisa ler outro registro do banco |
| **Domain** | novo enum, label, função pura compartilhada | precisa de query Prisma |
| **Prisma schema** | novo campo/tabela/índice persistente | dá para resolver só em memória |
| **Serialize** | formato da resposta JSON mudou | só mudou mensagem de erro |
| **Frontend service** | path, método ou payload da API mudou | só mudou layout |
| **Page / hook** | fluxo UI, estado local, composição | regra que deve valer para qualquer cliente |

### Reaproveitar sem duplicar

- Busque no mesmo domínio: `normalizeText`, `isUuid`, `parsePositiveInt` já existem (várias cópias locais — **ao tocar um arquivo, não espalhe mais uma cópia para outro módulo**; se já houver no arquivo, mantenha ali).
- Agenda: `agenda.utils.ts` para utilitários compartilhados de validators da agenda.
- Serialização: use `withMongoId`, `serializePatient`, `serializePatientRef`, etc., antes de inventar novo formato.
- Desativação de paciente: `agendaService` + `validatePatientDeactivationReplacements` — estenda, não reimplemente.
- UI de listas: `EntityList`, `EntityListItem`, `EntityListIconAction`, `EntityListPagination` em cadastros e pacientes.

### Compatibilidade com o legado do projeto

Respeite estas decisões históricas — **não "modernize" sem pedido**:

- Imports TypeScript com sufixo **`.js`** (moduleResolution NodeNext).
- IDs expostos como **`_id`** no JSON, não `id`.
- Enums em **MAIÚSCULAS** no banco (`AGENDADA`, `ADMINISTRADOR`).
- Rotas CRUD de pacientes/usuários com validação **dentro do arquivo de rotas** — padrão aceito, não refatorar para service só por estética.
- `AgendaService` é um arquivo grande fatiado em métodos privados — aceitável; não divida em múltiplos services sem necessidade.
- Frontend em **JSX** (não migrar para TSX por padrão).
- Alias `@/` no Vite para imports.

## Regras para Controllers (Routes)

- Um arquivo por domínio: `*.routes.ts`, export default `router`.
- Registrar em `routes/index.ts`.
- Prefixo `/api` aplicado em `app.ts` — rotas definem path completo (`/patients`, `/agenda/sessions`, …).
- Sempre `requireAuth` no `router.use` ou por rota quando público (login, health).
- Usar `asyncHandler` em handlers `async` que delegam a service (propaga erro ao `errorHandler`).
- Usar `getRouteId(req.params.id)` para normalizar parâmetro.
- Validar UUID na rota ou no validator antes de ir ao banco — mensagem padrão: `"Identificador de usuário inválido."` (para `Patient`).
- Status HTTP: `201` criação, `200` sucesso, erros via classes HTTP ou `res.status(4xx).json({ message })`.
- **Rotas finas:** máximo ~10 linhas no handler — só extrair body, chamar service, `res.json`.
- **Rotas com lógica:** manter `validate*Payload` e helpers no mesmo arquivo se já for o padrão do módulo.

## Regras para Services

- Exportar classe + instância singleton (`export const xService = new XService()`).
- Início do método público: chamar `validate*` quando existir validator para a operação.
- Lançar `NotFoundError` / `ConflictError` / `ValidationError` — não `new AppError(status, msg)` direto.
- Métodos privados para passos nomeados: `findSessionOrThrow`, `assertNoSchedulingConflicts`, `persistRoomCreate`.
- Passar `req.user` / `AuthUser` quando a regra depende de perfil (técnico vs admin).
- Transações para operações atômicas (ex.: criar protocolo com número sequencial).
- Arquivo grande é OK se métodos públicos forem legíveis — ver `backend/skills/backend-service-structure/SKILL.md`.
- Helpers compartilhados só dentro do domínio: `*.helpers.ts` adjacente ao service.

## Regras para Entities/Models

- Alterar schema em `prisma/schema.prisma` → `npm run db:migrate` → atualizar serialize se o JSON mudar.
- Enums novos: adicionar em Prisma **e** espelhar em `domain/` se usados em validators/middlewares.
- Não criar entidades TypeScript espelhando cada model Prisma — use tipos do `@prisma/client` ou interfaces locais mínimas nos services.
- Dados de auditoria (`createdById`, `updatedById`) seguem padrão das entidades existentes.

## Regras para Banco de Dados

- Toda persistência via Prisma — sem SQL cru exceto migrations.
- Migrations versionadas em `prisma/migrations/`; nome com timestamp descritivo.
- Índices e constraints no schema, não só na aplicação.
- Tratar `P2002` (unique) com `isPrismaUniqueViolation` de `db/errors.ts` quando aplicável.
- Testes de integração: `useIntegrationTestDatabase()`; seeds via helpers em `tests/integration/helpers/`.
- Não assumir ordem de testes paralelos — `fileParallelism: false` no Vitest.

## Regras para Frontend/Views

- Página nova: componente em `pages/`, rota em `AppRoutes.jsx`, entrada no menu em `config/modules.js` se aplicável.
- Manter páginas &lt; ~250 linhas — extrair para hook ou `features/<modulo>/components/` (ver `frontend/skills/frontend-componentization/SKILL.md`).
- Estado remoto: funções em `services/`; não duplicar URLs na página.
- Erros de API: `getApiErrorMessage`; sucesso: `useToast()`.
- Listas paginadas: padrão 20 itens, `EntityListPagination`, resumo `Mostrando X–Y de Z`.
- Permissões: guard na rota + condicional na UI (`useSession`, `normalizeRole`).
- Estilo visual: classes Tailwind existentes (`ama-blue`, `ama-cyan`, componentes `components/ui/`).
- Diálogos de domínio ficam em `features/<modulo>/components/`, não em `components/ui/`.

## O Que Evitar

- Introduzir camada repository, facade, DTO ou event bus.
- Refatorar `patients.routes.ts` / `users.routes.ts` para "ficar igual agenda" sem tarefa explícita.
- Criar util global genérico para uma única chamada.
- Mudar `_id` para `id` nas respostas (quebra frontend e testes).
- Validar só no frontend.
- Mensagens de erro genéricas quando o padrão do módulo é específico (`"O usuário substituto já participa desta sessão."`).
- Refactor drive-by em arquivos adjacentes.
- Nova dependência npm sem necessidade clara.
- Migrar JSX → TSX ou JavaScript → TypeScript no frontend como "melhoria".
- Ignorar atualização de `docs/modules/<modulo>.md`.
- Confundir `Patient` (usuário atendido) com `User` (funcionário) em nomes, rotas e textos.

## Checklist Antes de Finalizar

- [ ] Li `docs/modules/<modulo>.md` antes e atualizei depois (se mudança funcional).
- [ ] Li skills do escopo (`backend/skills/`, `frontend/skills/`).
- [ ] Segui o estilo do arquivo mais próximo (rota fina vs rota com lógica; service existente).
- [ ] Validação de entrada no lugar certo (`validators/` ou padrão inline do módulo).
- [ ] Erros com classes HTTP corretas; mensagens em português e consistentes com terminologia UI.
- [ ] Respostas JSON com `_id` quando expõem entidades.
- [ ] Permissões no middleware **e** no service quando a regra é contextual.
- [ ] Teste de integração cobre happy path e pelo menos um erro principal (backend).
- [ ] `npm test` e `npm run typecheck` passam no backend.
- [ ] `npm run build` passa no frontend.
- [ ] Service frontend alinhado se contrato de API mudou.
- [ ] Diff mínimo — sem arquivos e linhas desnecessários.
- [ ] Nenhuma abstração nova sem reuso real comprovado.
