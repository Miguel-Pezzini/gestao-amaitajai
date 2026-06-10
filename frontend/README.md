# Frontend — Gestão AMA Itajaí

Interface em **React 19** com **Vite**, **Tailwind CSS 4**, **shadcn/ui**, **React Router** e **Axios**. Consome a API documentada em [`../backend/README.md`](../backend/README.md).

Para setup completo e visão do monorepo, veja o [`README.md`](../README.md) na raiz.

---

## Pré-requisitos

- Node.js 20+
- API rodando em `http://localhost:3000` (ver backend)

---

## Configuração e execução

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App em `http://localhost:5173`.

Validar build:

```bash
npm run build
```

Variável típica no `.env`: URL base da API (`VITE_API_URL` ou conforme `.env.example`).

### Produção (Vercel)

- `VITE_API_URL` aponta para a URL completa da API no Railway (sem proxy em `vercel.json`).
- Após alterar variáveis `VITE_*`, é necessário redeploy.
- Variáveis do backend para sessão cross-domain: ver [`docs/modules/auth.md`](../docs/modules/auth.md).

---

## Estrutura de pastas

```
frontend/src/
├── components/
│   ├── ui/              # shadcn/ui (Button, Card, Dialog, …)
│   ├── layout/          # Sidebar, menu mobile
│   ├── cadastros/       # Listas e FAB de cadastros gerais
│   └── auth/            # RequireAdminRoute
├── config/
│   ├── modules.js       # Módulos do menu (habilitado, roles, rotas)
│   └── cadastros.js     # Itens do submenu Cadastros Gerais
├── contexts/
│   ├── session-context.jsx   # Usuário logado
│   └── toast-context.jsx
├── features/
│   ├── agenda/          # Calendário, grade horária, sessões
│   └── room-occupancy/  # Ocupação de salas
├── hooks/               # useAgendaPage, useRoomOccupancy, …
├── layouts/
│   └── AppLayout.jsx    # Shell com sidebar
├── pages/               # Uma página por rota principal
├── routes/
│   └── AppRoutes.jsx    # Definição de rotas
├── services/            # Cliente HTTP (api.js, auth, patients, agenda)
└── lib/                 # Utilitários (cn, erros de API, navegação)
```

### Organização por feature

Lógica de UI mais complexa fica em `features/<domínio>/` (componentes, utils, constants), não diretamente em `pages/`. A página importa e compõe esses blocos — exemplo: `AgendaPage` + `features/agenda/`.

---

## Rotas e módulos

Definidas em `routes/AppRoutes.jsx`. Módulos do menu lateral vêm de `config/modules.js`:

| Rota | Página | Quem acessa | Status |
|---|---|---|---|
| `/` | Home | admin, técnico | Ativo |
| `/patients` | Pacientes | admin | Ativo |
| `/agenda` | Agenda | admin, técnico | Ativo |
| `/salas/ocupacao` | Ocupação salas | admin | Ativo |
| `/cadastros/*` | Cadastros gerais | admin | Ativo |
| `/attendance` | Presença | — | Em breve |
| `/check-in` | Check-in | — | Em breve |
| `/waitlist` | Fila | — | Em breve |
| `/login` | Login | público | — |

`enabled: false` em `modules.js` oculta itens do menu; rotas de “em breve” usam `ModuleComingSoonPage`.

### Cadastros gerais

Submenu configurado em `config/cadastros.js`:

- `/cadastros/modalidades`
- `/cadastros/salas`
- `/cadastros/tipos-sessao`
- `/cadastros/funcionarios`

Rotas admin usam `<RequireAdminRoute>`.

---

## Autenticação no frontend

1. `LoginPage` envia credenciais para `/api/auth/login`.
2. API define cookie httpOnly; `services/api.js` usa `withCredentials: true`.
3. `SessionProvider` carrega o usuário via `/api/auth/me` ao abrir o app.
4. `session.role` define o que aparece no menu (`modules.js` → `requiredRoles`).

Logout limpa sessão no backend e redireciona para `/login`.

---

## Agenda (visão rápida)

Implementação principal em `features/agenda/`:

- Modos de visualização: dia, semana, mês (`AgendaViewModeToggle`)
- Criação/edição/cancelamento via dialogs (`CreateSessionDialog`, `CancelSessionDialog`, `SessionDetailDialog`)
- Grade horária com sessões sobrepostas (`AgendaTimeGrid`, `AgendaWeekView`, …)
- Busca de pacientes e profissionais para vincular à sessão

Regras de negócio (modalidades, conflitos, permissões): [`../docs/REGRAS-NEGOCIO-AGENDA.md`](../docs/REGRAS-NEGOCIO-AGENDA.md).

---

## Convenções de UI

### shadcn/ui (obrigatório para blocos reutilizáveis)

- Componentes base em `src/components/ui/`
- Adicionar novos: `npx shadcn@latest add <componente>`
- Configuração: `components.json`

### Tema AMA

Cores institucionais aplicadas via classes Tailwind (ver paleta no README da raiz). Manter contraste acessível (WCAG AA) em botões e textos.

### Erros de API

`lib/api-error.js` extrai mensagens da resposta para exibir no toast ou em `FieldError` nos formulários.

---

## Serviços HTTP

| Arquivo | Domínio |
|---|---|
| `services/api.js` | Instância Axios compartilhada |
| `services/auth.js` | Login, logout, sessão |
| `services/patients.js` | Pacientes |
| `services/agenda.js` | Sessões, lookups da agenda |
| `services/users.js` | Funcionários |

Padrão: funções async que retornam dados já tratados; páginas e hooks chamam os services, não montam URLs soltas.

---

## Alias de import

O projeto usa `@/` para `src/` (configurado no Vite). Exemplo:

```javascript
import { Button } from "@/components/ui/button";
```

---

## O que implementar em seguida

Consulte [`../TODO.md`](../TODO.md). No frontend, os próximos módulos provavelmente serão:

1. Habilitar módulo **Presença** em `modules.js` e substituir `ModuleComingSoonPage`
2. **Check-in** com painel em tempo real (polling ou websocket — alinhar com o backend)
3. **Fila de espera**

Ao criar um módulo novo, siga o padrão: entrada em `modules.js`, rota em `AppRoutes.jsx`, `services/<modulo>.js`, `pages/` + `features/<modulo>/`.

---

## Skills para agentes de IA

Convenções de UI e estrutura: [`skills/README.md`](skills/README.md).
