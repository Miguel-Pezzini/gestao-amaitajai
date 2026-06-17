# Módulo: Pacientes

**Última atualização:** 2026-06-16  
**Escopo:** fullstack

---

## Visão geral

Cadastro e gestão de pacientes da instituição. Inclui desativação com impacto automático na agenda (cancelamento ou substituição de paciente em sessões futuras).

---

## Regras de negócio

### Cadastro

Paciente possui: nome completo, data de nascimento, responsável, telefone, fonte de custeio (`fundingSourceId`), flag `isActive` e campos clínicos opcionais de texto livre: `diagnosis` (Diagnóstico), `supportLevel` (Nível de suporte), `medication` (Medicação), `allergies` (Alergias), `reinforcers` (Reforçadores). Cada campo clínico aceita até 10.000 caracteres; omitido ou vazio persiste como string vazia.

Fontes de custeio são cadastradas em **Cadastros gerais → Fontes de Custeio** (`PatientFundingSource`). Valores iniciais migrados: Municipal, Estadual, Particular. Apenas fontes ativas podem ser atribuídas a novos pacientes ou em edição.

### Desativação (`isActive: false`)

Ao desativar, o sistema analisa sessões `AGENDADA` futuras do paciente:

| Modalidade | Pacientes na sessão | Efeito |
|---|---|---|
| INDIVIDUAL | 1 | **Cancela** a sessão |
| DUPLA | 2 | **Exige substituto** (outro paciente ativo) |
| grupo | >1 | **Exige substituto** na série/sessão |
| grupo | 1 (só ele) | **Cancela** a sessão |

- Substituições podem ser por **série** (`seriesId`) ou **sessão isolada** (`sessionId`), nunca ambos.
- Substituto deve existir e estar ativo.
- Motivo de cancelamento: `Paciente desativado: <nome>`.
- Reativação (`isActive: true`) não reverte sessões canceladas.

### Listagem

Filtros: `search` (nome ou responsável), `fundingSourceId`, `status` (`active`/`inactive`). Paginação: page/limit (máx 100).

---

## Funcionalidades atuais

### Backend — rotas (`/patients/*`)

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/patients` | admin, tecnico | Lista com filtros e paginação |
| POST | `/patients` | admin, tecnico | Criar paciente |
| GET | `/patients/:id` | admin, tecnico | Detalhe |
| PATCH | `/patients/:id` | admin, tecnico | Atualizar campos |
| GET | `/patients/:id/deactivation-impact` | admin, tecnico | Prévia de cancelamentos/substituições |
| PATCH | `/patients/:id/status` | admin, tecnico | Ativar/desativar (com `replacements` se necessário) |
| GET | `/patients/:id/evolutions` | admin, tecnico | Histórico de evoluções do paciente (`page`, `limit`, `excludeSessionId` opcional) |

### Frontend

| Rota | Componente | Descrição |
|---|---|---|
| `/patients` | `PatientsPage` | Lista, cadastro, edição, desativação |

Componentes de desativação: `DeactivatePatientDialog`, `PatientReplacementPicker`.  
Hook: `usePatientDeactivation.js`.

**Lista de pacientes:** ações por item (`Sessões`, `Evoluções`, `Protocolos`, `Editar`, `Inativar`/`Reativar`) exibidas como ícones compactos com tooltip no hover, via `EntityListIconAction` + `Tooltip` em `EntityListItem.jsx`.

**Histórico de sessões:** ícone `Sessões` abre `PatientSessionsDialog` com listagem paginada via `GET /agenda/sessions?patientId=…&includeCancelled=true&page&limit`, filtros de status (`AGENDADA`, `REALIZADA`, `CANCELADA`) e intervalo de datas. Resumo `Mostrando X–Y de Z` e controles Anterior/Próxima (20 itens por página).

**Evolução clínica:** texto livre por paciente e por sessão (`PatientSessionEvolution`). Preenchimento na agenda (`SessionDetailDialog`); histórico na lista de pacientes via ícone `Evoluções` → `PatientEvolutionsDialog` (`GET /patients/:id/evolutions`, paginado). O histórico é **por paciente**, independente da modalidade (individual, dupla ou grupo) — como prontuário contínuo (relato de atendimento). PDI permanece fora do sistema nesta fase.

**Paginação:** a listagem consome `page`/`limit` da API (20 itens por página). Resumo `Mostrando X–Y de Z` no cabeçalho; controles Anterior/Próxima via `EntityListPagination` quando há mais de uma página. Nova busca com filtros reinicia na página 1.

---

## Validações importantes

| Campo | Validação | Onde |
|---|---|---|
| `fullName` | obrigatório | `patients.routes.ts` |
| `birthDate` | válida, não futura, ≤120 anos | `patients.routes.ts` |
| `guardianName` | obrigatório | `patients.routes.ts` |
| `phone` | 10–11 dígitos, formatado `(XX) XXXXX-XXXX` | `patients.routes.ts` |
| `fundingSourceId` | UUID de fonte ativa | `patients.routes.ts` |
| `diagnosis` | opcional, texto livre, máx. 10.000 caracteres | `patients.routes.ts` |
| `supportLevel` | opcional, texto livre, máx. 10.000 caracteres | `patients.routes.ts` |
| `medication` | opcional, texto livre, máx. 10.000 caracteres | `patients.routes.ts` |
| `allergies` | opcional, texto livre, máx. 10.000 caracteres | `patients.routes.ts` |
| `reinforcers` | opcional, texto livre, máx. 10.000 caracteres | `patients.routes.ts` |
| `isActive` | booleano no PATCH status | `patients.routes.ts` |
| `replacements` | array com `replacementPatientId` + `seriesId` XOR `sessionId` | `patient-deactivation.validator.ts` |
| Cobertura de substituições | todas as séries/sessões que exigem substituto devem ter entrada | `agenda.service.ts` |

---

## Permissões

| Ação | administrador | tecnico | recepcao |
|---|---|---|---|
| CRUD pacientes | sim | sim | não |
| Desativar com impacto na agenda | sim | sim | não |
| Consultar histórico de evoluções | sim | sim | não |
| Registrar/editar evolução na sessão | sim | sim (só própria sessão) | não |

Rotas de pacientes, evoluções e presença exigem `requireClinicalOperator` (`ADMINISTRADOR` ou `TECNICO`). Perfil `RECEPCAO` é bloqueado na API e no frontend (`RequireAdminRoute` em `/patients`).

---

## Arquivos principais

| Camada | Caminho |
|---|---|
| Rotas | `backend/src/routes/patients.routes.ts` |
| Service (impacto agenda) | `backend/src/services/agenda.service.ts` |
| Helpers desativação | `backend/src/services/patient-deactivation.helpers.ts` |
| Validator | `backend/src/validators/patient-deactivation.validator.ts` |
| Schema | `backend/prisma/schema.prisma` (Patient, PatientSessionEvolution) |
| Service evolução | `backend/src/services/patient-evolution.service.ts` |
| Página | `frontend/src/pages/PatientsPage.jsx` |
| Feature | `frontend/src/features/patients/` |
| Service API | `frontend/src/services/patients.js` |
| Testes integração | `backend/tests/integration/patients.test.ts`, `backend/tests/integration/patient-evolutions.test.ts` |
| Testes unitários | `backend/tests/unit/patient-deactivation.helpers.test.ts` |

---

## Pendências e decisões abertas

- Restringir cadastro/edição de pacientes só para admin?
- Histórico de desativações e auditoria de quem desativou.
- PDI no sistema e migração dos Google Forms antigos.

---

## Como testar

```bash
cd backend && npm run test:integration -- patients.test.ts
cd backend && npm run test:unit -- patient-deactivation
```

Manual:
1. Criar paciente com dados inválidos (telefone curto) → 400.
2. Agendar sessão dupla com paciente A e B → desativar A → exige substituto.
3. Desativar sem informar substituto quando obrigatório → erro.
4. GET `/deactivation-impact` antes de confirmar → lista cancelamentos e substituições.
