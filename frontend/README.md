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

### Padrão de UI (obrigatório)

- Priorizar componentes de `src/components/ui` (base `shadcn/ui`) em todas as telas.
- Evitar ao máximo marcação HTML "pura" para blocos visuais reutilizáveis (cards, badges, botões, inputs, labels, etc.).
- Ao criar nova interface, primeiro verificar se já existe componente em `ui/`; se não existir, criar componente no estilo `shadcn/ui`.
- Manter consistência de tema AMA (cores e estados) via classes utilitárias aplicadas nos componentes.

## Telas atuais

- `LoginPage`: autenticação com sessão via cookie httpOnly.
- `HomePage`: dashboard inicial com sidebar lateral, cards de resumo e atalhos de módulos, estruturado com `Button`, `Card` e `Badge`.
