# Módulo: Ocupação de salas

**Última atualização:** 2026-06-09  
**Escopo:** frontend (consome API da Agenda)

---

## Visão geral

Visualização administrativa da ocupação de salas em grade horária (segunda a sexta, 8h–18h). Não possui API própria — reutiliza sessões e salas do módulo Agenda.

---

## Regras de negócio

- Apenas administradores acessam (`RequireAdminRoute`).
- Exibe sessões `agendadas` e `realizadas` no período selecionado.
- Grade fixa: dias úteis, horário comercial 8h–18h.
- Clique em sessão abre `SessionDetailDialog` (compartilhado com Agenda).
- Navegação por semana e seleção de sala.

---

## Funcionalidades atuais

### Frontend

| Rota | Componente | Descrição |
|---|---|---|
| `/salas/ocupacao` | `RoomOccupancyPage` | Grade de ocupação |

| Componente | Função |
|---|---|
| `RoomOccupancyGrid` | Grade horária com blocos de sessão |
| `RoomOccupancyNav` | Navegação semana + seletor de sala |
| `RoomOccupancyBlock` | Célula/bloco de sessão |
| `RoomOccupancySessionGroup` | Agrupamento visual |

Hook: `useRoomOccupancy.js`.  
Utils: `frontend/src/features/room-occupancy/utils.js`.

### Backend

Nenhuma rota dedicada. Dados via:
- `GET /agenda/rooms`
- `GET /agenda/sessions?startAt&endAt`

---

## Validações importantes

Validações herdadas da API de agenda (filtro por intervalo de datas). O hook deve enviar `startAt`/`endAt` coerentes com a semana exibida.

---

## Permissões

| Ação | administrador | tecnico |
|---|---|---|
| Ver ocupação de salas | sim | não |

---

## Arquivos principais

| Camada | Caminho |
|---|---|
| Página | `frontend/src/pages/RoomOccupancyPage.jsx` |
| Feature | `frontend/src/features/room-occupancy/` |
| Hook | `frontend/src/hooks/useRoomOccupancy.js` |
| Dialog compartilhado | `frontend/src/features/agenda/components/SessionDetailDialog.jsx` |

---

## Pendências e decisões abertas

- Horário de funcionamento configurável (hoje fixo 8h–18h).
- Incluir sábado ou feriados?
- Exportar/imprimir grade.

---

## Como testar

Manual:
1. Login admin → `/salas/ocupacao` → grade com sessões da semana.
2. Login técnico → rota bloqueada.
3. Trocar sala e semana → dados atualizam.
4. Clicar sessão → modal de detalhe abre.
