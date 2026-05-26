# Gestão AMA Itajaí

Sistema web para gestão institucional da AMA Itajaí, com foco em organização de atendimentos, agenda, presença, fila de espera e evolução para outros módulos da ONG.

## Objetivo do projeto

Entregar uma plataforma de gestão para apoiar a rotina administrativa e terapêutica da AMA Itajaí, centralizando informações e reduzindo processos manuais.

## Escopo inicial (MVP)

Baseado no levantamento de requisitos já realizado, o MVP prioriza:

- Cadastro de pacientes por fonte de custeio
- Agenda diária e semanal por profissional
- Controle de presença e faltas com justificativa
- Lista de presença para impressão
- Painel de check-in em tempo real
- Gestão de fila de espera com prioridade

## Identidade visual (tema do sistema)

O tema do sistema deve seguir a identidade da landing page da AMA Itajaí para manter consistência institucional:

- Referência visual: [amaitajai.org.br](https://amaitajai.org.br/)
- Direção visual: institucional, acolhedora, limpa e acessível

### Paleta sugerida (inspirada na landing)

- `AmaBlueDark`: `#003B63` (menus, header, títulos principais)
- `AmaBlue`: `#005E8F` (botões primários e destaques)
- `AmaCyan`: `#00B5E2` (detalhes, linhas de destaque, elementos ativos)
- `AmaLight`: `#EAF8FF` (fundos suaves de cards/seções)
- `AmaText`: `#1F2A37` (texto padrão)
- `AmaWhite`: `#FFFFFF` (fundo base)

### Regras de aplicação do tema

- **Header/Nav:** fundo `AmaBlueDark` com texto claro
- **Botão primário:** fundo `AmaBlue`, hover em tom mais escuro
- **Botão secundário:** borda `AmaCyan`, texto `AmaBlueDark`
- **Cards:** fundo branco, borda leve em `AmaCyan`, cantos arredondados
- **Links e estados ativos:** usar `AmaCyan`
- **Feedback de interface:**
  - sucesso: verde acessível (não conflitar com azul principal)
  - aviso: âmbar suave
  - erro: vermelho acessível

### Diretriz de UX e acessibilidade

- Manter contraste mínimo WCAG AA em textos e botões
- Priorizar tipografia legível em telas administrativas
- Evitar poluição visual; usar espaços e blocos bem definidos
- Garantir consistência entre telas (agenda, cadastro, fila, check-in)

## Stack do projeto

| Camada | Tecnologia |
|---|---|
| Frontend | React, Vite, Tailwind CSS, shadcn/ui, React Router, Axios |
| Backend | Express.js, Mongoose |
| Banco | MongoDB (Docker Compose em `backend/`) |

## Convenção de interface (frontend)

- Priorizar componentes `shadcn/ui` para construção de telas.
- Evitar ao máximo HTML puro em blocos visuais reutilizáveis.
- Antes de criar estrutura manual, verificar `frontend/src/components/ui/`.
- Novos componentes visuais devem seguir padrão `shadcn/ui` para facilitar manutenção e estilização futura.

## Setup rápido (ambiente local)

### 1) Banco de dados

```bash
cd backend
cp .env.example .env
docker compose up -d
```

### 2) API

```bash
cd backend
npm install
npm run dev
```

### 3) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- API: `http://localhost:3000`
- App: `http://localhost:5173`

## Documentação complementar

- [`PROJETO-EXTENSAO.md`](PROJETO-EXTENSAO.md)
- [`REQUISITOS.md`](REQUISITOS.md)
- [`TODO.md`](TODO.md)
- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
