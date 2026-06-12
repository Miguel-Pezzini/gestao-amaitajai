# Módulo: Agenda

**Última atualização:** 2026-06-12  
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

**Conflitos bloqueiam agendamento:** profissional, paciente ou sala não podem ter sobreposição de horário com outra sessão `AGENDADA`. Para profissionais de **apoio** em sessão `GRUPO`, a ocupação considera apenas a janela parcial informada (entrada/saída), não a sessão inteira.

### Profissionais de apoio (GRUPO)

- Disponível **somente** em modalidade `GRUPO`.
- Cada vínculo profissional↔sessão pode ter `isApoio=true` com `participationStartAt` e `participationEndAt`.
- Sem apoio (`isApoio=false`): profissional ocupa a sessão inteira (comportamento anterior).
- Horários de apoio devem estar contidos em `[session.startAt, session.endAt]`.
- Profissionais de apoio contam para min/max de profissionais da modalidade.
- Em recorrência semanal, horários de apoio são **fixos de relógio** em cada ocorrência (ex.: sempre 10:15–10:45).
- Disponibilidade na UI: profissionais parcialmente ocupados na sessão **podem ser selecionados** em GRUPO; marque Apoio e ajuste entrada/saída. A validação final usa só a janela do apoio.

**Status:** `AGENDADA` → `REALIZADA` ou `CANCELADA`. Sessão cancelada não pode ser editada nem concluída.

### Recorrência semanal

- Ao criar sessão com `recurrence.enabled = true`, gera série (`SessionSeries`) e múltiplas ocorrências.
- Campos: `weekdays` (0=dom … 6=sáb), `endsAt` (default: +90 dias do início).
- Conflitos em qualquer data da série bloqueiam a criação inteira.
- Edição/cancelamento suportam escopo: `SINGLE` (só esta), `FUTURE` (esta e futuras), `ALL` (toda a série).
- Sessões `CANCELADA` não aparecem na listagem padrão da agenda (calendário); permanecem consultáveis no histórico do paciente.

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
| PATCH | `/agenda/sessions/:id` | admin | Editar sessão (escopo SINGLE/FUTURE/ALL) |
| PATCH | `/agenda/sessions/:id/cancel` | admin | Cancelar (escopo SINGLE/FUTURE/ALL) |
| PATCH | `/agenda/sessions/:id/complete` | auth | Marcar como realizada (valida presença dos pacientes) |
| GET | `/agenda/sessions/:id/attendance` | auth | Presença atual dos pacientes da sessão |
| PUT | `/agenda/sessions/:id/attendance/:patientId` | auth | Registrar/atualizar presença do paciente na sessão |
| GET | `/agenda/sessions/:id/evolutions` | auth | Evolução atual dos pacientes da sessão (histórico via `/patients/:id/evolutions`) |
| PUT | `/agenda/sessions/:id/evolutions/:patientId` | auth | Criar/atualizar evolução do paciente na sessão |

Filtros de listagem: `status`, `startAt`, `endAt`, `professionalId` (só admin), `patientId`, `includeCancelled` (inclui canceladas quando `status` não é informado). Com `page`/`limit`, retorna `pagination` (20 itens por página no histórico do paciente; agenda sem paginação).

### Frontend

| Rota | Componente | Descrição |
|---|---|---|
| `/agenda` | `AgendaPage` | Calendário dia/semana/mês; criar, editar, cancelar, detalhar sessões |

Visões: dia, semana (grade horária), mês, semana por slot. Suporte a recorrência na criação/cancelamento; edição com escopo em séries recorrentes. Sessões canceladas somem do calendário após o cancelamento.

**Carregamento por período visível:** ao abrir a agenda ou navegar (setas, troca de visão), o frontend busca sessões apenas do intervalo exibido via `GET /agenda/sessions?startAt=&endAt=`:

| Visão | Intervalo |
|---|---|
| Semana (padrão) | domingo 00:00 → sábado 23:59 da semana de `referenceDate` |
| Mês | dia 1 → último dia do mês |
| Dia | dia selecionado 00:00 → 23:59 |

Após criar, editar, cancelar ou concluir sessão, re-busca só o período visível. Helpers em `frontend/src/features/agenda/utils.js` (`getAgendaQueryRange`); lógica em `useAgendaPage.js`. Histórico do paciente (`PatientSessionsDialog`) continua com paginação própria.

**Pacientes → Sessões:** `PatientSessionsDialog` lista o histórico de sessões do paciente com filtros de status e período (inclui canceladas).

**Presença na sessão:** `SessionDetailDialog` exibe, por paciente, o status de presença (`PRESENTE`, `FALTA`, `FALTA_JUSTIFICADA`) com destaque visual (verde / vermelho / âmbar). O padrão ao vincular paciente à sessão é `PRESENTE`. Falta justificada exige texto de justificativa. Edição permitida em sessões `AGENDADA` e `REALIZADA`; bloqueada em `CANCELADA`. O botão **Marcar como realizada** fica desabilitado na UI se houver falta justificada sem texto; o backend também valida antes de concluir.

**Evolução clínica:** `SessionDetailDialog` exibe evolução apenas para pacientes com presença `PRESENTE` (falta e falta justificada não exibem formulário). Por paciente presente: histórico de evoluções anteriores e campo de texto livre para a sessão atual. O histórico agrega **todas** as sessões do paciente (qualquer modalidade), ordenado por data. Salvamento independente de marcar `REALIZADA`.

---

## Validações importantes

| Regra | Mensagem/Comportamento | Arquivo |
|---|---|---|
| Tipo, modalidade, sala, início, duração obrigatórios | ValidationError | `session.validator.ts` |
| Mín/máx pacientes e profissionais por modalidade | ValidationError | `agenda.service.ts` |
| Modalidade permitida pelo tipo | ValidationError | `session.validator.ts` |
| Conflito sala/paciente/profissional | ConflictError | `agenda-availability.helpers.ts` |
| Apoio só em GRUPO | ValidationError | `session-professional.validator.ts` |
| Horários de apoio dentro da sessão | ValidationError | `session-professional.validator.ts` |
| Conflito parcial de apoio | ConflictError | `agenda.service.ts` |
| Motivo obrigatório no cancelamento | ValidationError | `session.validator.ts` |
| Recorrência: ≥1 weekday, endsAt ≥ startsAt | ValidationError | `recurrence.validator.ts` |
| Técnico só conclui sessão própria | ForbiddenError | `agenda.service.ts` |
| Tipo tea-14-plus só grupo | ValidationError | `session-type.validator.ts` |
| Evolução: paciente deve participar da sessão | ValidationError | `patient-evolution.service.ts` |
| Evolução em sessão cancelada | ValidationError | `patient-evolution.service.ts` |
| Técnico só acessa evolução da própria sessão | ForbiddenError | `patient-evolution.service.ts` |
| Conteúdo da evolução: texto, máx. 10.000 caracteres | ValidationError | `patient-evolution.validator.ts` |
| Presença: paciente deve participar da sessão | ValidationError | `patient-attendance.service.ts` |
| Presença em sessão cancelada | ValidationError | `patient-attendance.service.ts` |
| Técnico só acessa presença da própria sessão | ForbiddenError | `patient-attendance.service.ts` |
| Status de presença: PRESENTE, FALTA ou FALTA_JUSTIFICADA | ValidationError | `patient-attendance.validator.ts` |
| Falta justificada: justificativa obrigatória (máx. 2.000 caracteres) | ValidationError | `patient-attendance.validator.ts` |
| Justificativa só em FALTA_JUSTIFICADA | ValidationError | `patient-attendance.validator.ts` |
| Concluir sessão: falta justificada sem texto bloqueia | ValidationError | `agenda.service.ts` |

---

## Permissões

| Ação | administrador | tecnico |
|---|---|---|
| Criar/editar/cancelar sessão | sim | não |
| Marcar realizada | sim (qualquer) | sim (só própria) |
| Registrar/editar evolução na sessão | sim (qualquer) | sim (só própria) |
| Registrar/editar presença na sessão | sim (qualquer) | sim (só própria) |
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
| Validator apoio | `backend/src/validators/agenda/session-professional.validator.ts` |
| Domínio | `backend/src/domain/agenda.ts` |
| Schema | `backend/prisma/schema.prisma` (Session, SessionSeries, Room, SessionType) |
| Página | `frontend/src/pages/AgendaPage.jsx` |
| Hook | `frontend/src/hooks/useAgendaPage.js` |
| Feature | `frontend/src/features/agenda/` |
| Editor apoio (GRUPO) | `frontend/src/features/agenda/components/SelectedProfessionalsEditor.jsx` |
| Presença na sessão | `frontend/src/features/agenda/components/SessionPatientAttendance.jsx` |
| Evolução na sessão | `frontend/src/features/agenda/components/SessionPatientEvolutions.jsx` |
| Service presença | `backend/src/services/patient-attendance.service.ts` |
| Service evolução | `backend/src/services/patient-evolution.service.ts` |
| Rotas presença | `backend/src/routes/patient-attendances.routes.ts` |
| Rotas evolução | `backend/src/routes/patient-evolutions.routes.ts` |
| Service API | `frontend/src/services/agenda.js`, `frontend/src/services/patient-attendances.js`, `frontend/src/services/patient-evolutions.js` |
| Testes integração | `backend/tests/integration/agenda.test.ts`, `backend/tests/integration/patient-attendances.test.ts`, `backend/tests/integration/patient-evolutions.test.ts` |
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
