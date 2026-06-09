# Módulo: Agenda

**Última atualização:** 2026-06-09  
**Escopo:** fullstack

---

## Visão geral

Agenda institucional de sessões terapêuticas. Administradores gerenciam sessões, salas, tipos e modalidades; técnicos visualizam apenas a própria agenda e marcam execução (`realizada`).

---

## Regras de negócio

### Perfis

| Perfil | Pode fazer |
|---|---|
| `ADMINISTRADOR` | CRUD de sessões, salas, tipos, modalidades; ver agenda de qualquer profissional |
| `TECNICO` | Listar apenas sessões em que é profissional; marcar `REALIZADA` na própria sessão |

### Sessão

Uma sessão tem: data/hora, duração, sala, tipo de atendimento, modalidade (`INDIVIDUAL`/`DUPLA`/`GRUPO`), pacientes, profissionais e status.

**Limites por modalidade** (configuráveis em `SessionModalitySetting`, defaults no service):

| Modalidade | Pacientes | Profissionais |
|---|---|---|
| INDIVIDUAL | 1 | 1 |
| dupla | 2 | 2 |
| grupo | 1–15 | 2–4 |

**Conflitos bloqueiam agendamento:** profissional, paciente ou sala não podem ter sobreposição de horário com outra sessão `AGENDADA`.

**Status:** `AGENDADA` → `REALIZADA` ou `CANCELADA`. Sessão cancelada não pode ser editada nem concluída.

### Recorrência semanal

- Ao criar sessão com `recurrence.enabled = true`, gera série (`SessionSeries`) e múltiplas ocorrências.
- Campos: `weekdays` (0=dom … 6=sáb), `endsAt` (default: +90 dias do início).
- Conflitos em qualquer data da série bloqueiam a criação inteira.
- Edição/cancelamento suportam escopo: `SINGLE` (só esta), `FUTURE` (esta e futuras), `ALL` (toda a série, só cancelamento).

### Tipos de atendimento

- Cada `SessionType` tem duração padrão, flag `isDurationFlexible` e modalidades permitidas.
- Regra especial: slug `tea-14-plus` aceita **apenas** modalidade `grupo`.

### Tipos confirmados (referência ONG)

| Tipo | Duração padrão |
|---|---:|
| PSICOPED | 30 min |
| INTENSIVO | 60 min (flexível) |
| INTERVENÇÃO PRECOCE | 90 min |
| Grupo de Habilidades Sociais | 60 min |
| TEA 14+ | 120 min (só grupo) |
| Trilhar | 60 min |

---

## Funcionalidades atuais

### Backend — rotas (`/agenda/*`)

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/agenda/lookups/patients` | auth | Busca pacientes para agendamento |
| GET | `/agenda/lookups/professionals` | auth | Busca profissionais |
| GET | `/agenda/rooms` | auth | Lista salas |
| POST/PATCH | `/agenda/rooms` | admin | Criar/editar sala |
| PATCH | `/agenda/rooms/:id/status` | admin | Ativar/desativar sala |
| GET | `/agenda/session-types` | auth | Lista tipos de sessão |
| POST/PATCH | `/agenda/session-types` | admin | Criar/editar tipo |
| PATCH | `/agenda/session-types/:id/status` | admin | Ativar/desativar tipo |
| GET | `/agenda/session-modalities` | auth | Lista limites por modalidade |
| PATCH | `/agenda/session-modalities/:modality` | admin | Atualizar limites |
| GET | `/agenda/sessions` | auth | Lista sessões (técnico: só as suas) |
| POST | `/agenda/sessions` | admin | Criar sessão (com ou sem recorrência) |
| PATCH | `/agenda/sessions/:id` | admin | Editar sessão (escopo SINGLE/FUTURE) |
| PATCH | `/agenda/sessions/:id/cancel` | admin | Cancelar (escopo SINGLE/FUTURE/ALL) |
| PATCH | `/agenda/sessions/:id/complete` | auth | Marcar como realizada |

Filtros de listagem: `status`, `startAt`, `endAt`, `professionalId` (só admin).

### Frontend

| Rota | Componente | Descrição |
|---|---|---|
| `/agenda` | `AgendaPage` | Calendário dia/semana/mês; criar, editar, cancelar, detalhar sessões |

Visões: dia, semana (grade horária), mês, semana por slot. Suporte a recorrência na criação/edição/cancelamento.

---

## Validações importantes

| Regra | Mensagem/Comportamento | Arquivo |
|---|---|---|
| Tipo, modalidade, sala, início, duração obrigatórios | ValidationError | `session.validator.ts` |
| Mín/máx pacientes e profissionais por modalidade | ValidationError | `agenda.service.ts` |
| Modalidade permitida pelo tipo | ValidationError | `session.validator.ts` |
| Conflito sala/paciente/profissional | ConflictError | `agenda-availability.helpers.ts` |
| Motivo obrigatório no cancelamento | ValidationError | `session.validator.ts` |
| Recorrência: ≥1 weekday, endsAt ≥ startsAt | ValidationError | `recurrence.validator.ts` |
| Técnico só conclui sessão própria | ForbiddenError | `agenda.service.ts` |
| Tipo tea-14-plus só grupo | ValidationError | `session-type.validator.ts` |

---

## Permissões

| Ação | administrador | tecnico |
|---|---|---|
| Criar/editar/cancelar sessão | sim | não |
| Marcar realizada | sim (qualquer) | sim (só própria) |
| Ver agenda de outros | sim | não |
| Cadastros (salas, tipos, modalidades) | sim | não |

Auditoria: `createdById`, `updatedById` em sessões e séries.

---

## Arquivos principais

| Camada | Caminho |
|---|---|
| Rotas | `backend/src/routes/agenda.routes.ts` |
| Service | `backend/src/services/agenda.service.ts` |
| Helpers recorrência | `backend/src/services/session-recurrence.helpers.ts` |
| Helpers conflitos | `backend/src/services/agenda-availability.helpers.ts` |
| Validators | `backend/src/validators/agenda/*.ts` |
| Domínio | `backend/src/domain/agenda.ts` |
| Schema | `backend/prisma/schema.prisma` (Session, SessionSeries, Room, SessionType) |
| Página | `frontend/src/pages/AgendaPage.jsx` |
| Hook | `frontend/src/hooks/useAgendaPage.js` |
| Feature | `frontend/src/features/agenda/` |
| Service API | `frontend/src/services/agenda.js` |
| Testes integração | `backend/tests/integration/agenda.test.ts` |
| Testes unitários | `backend/tests/unit/session-recurrence.helpers.test.ts` |

---

## Pendências e decisões abertas

- Grupo: existe mínimo obrigatório além do máximo 15?
- Trilhar 2x/semana: regra por paciente, turma ou só referência?
- Horários de operação: slots fixos ou livres?
- Intensivo flexível: quem pode ajustar e limites min/max?
- Assinatura digital (fase futura).

---

## Como testar

```bash
cd backend && npm run test:integration -- agenda.test.ts
cd backend && npm run test:unit -- session-recurrence
```

Manual:
1. Admin cria sessão individual → deve aparecer no calendário.
2. Tentar sobrepor mesma sala → erro de conflito.
3. Técnico marca própria sessão como realizada → ok; em sessão alheia → 403.
4. Criar recorrência semanal → múltiplas ocorrências; cancelar `FUTURE` → só futuras canceladas.
