# Módulo: Protocolos

**Última atualização:** 2026-06-09  
**Escopo:** fullstack

---

## Visão geral

Registro e acompanhamento de solicitações administrativas dos responsáveis (documentos, trocas de horário, etc.), vinculadas a pacientes. Tipos de solicitação são cadastrados em Cadastros Gerais.

---

## Regras de negócio

### Status

| Status | Descrição |
|---|---|
| `PENDENTE` | Protocolo aberto, aguardando conclusão |
| `CONCLUIDO` | Solicitação atendida; registra `completedAt` |
| `CANCELADO` | Solicitação encerrada sem conclusão; exige `cancelReason` e registra `cancelledAt` |

- Só protocolos `PENDENTE` podem ser concluídos ou cancelados.
- Ao concluir, o sistema grava a data/hora em `completedAt`.
- Ao cancelar, o administrador informa justificativa obrigatória; o sistema grava `cancelReason` e `cancelledAt`.
- Protocolos cancelados ou concluídos não entram na contagem de pendências do paciente.

### Numeração

Número sequencial por ano: `AAAANNNNN` (ex.: 202600001).

---

## Funcionalidades atuais

### Backend — rotas (`/protocols/*`, `/protocol-types/*`)

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/protocols` | admin | Lista com filtros (search, status, patientId) |
| GET | `/protocols/:id` | admin | Detalhe |
| POST | `/protocols` | admin | Abrir protocolo |
| PATCH | `/protocols/:id/status` | admin | Concluir ou cancelar |
| GET | `/patients/:patientId/protocols` | admin | Protocolos do paciente |
| GET/POST/PATCH | `/protocol-types` | admin | CRUD tipos de solicitação |

### Frontend

| Rota | Componente | Descrição |
|---|---|---|
| `/protocols` | `ProtocolsPage` | Lista geral, conclusão e cancelamento |
| Pacientes | `PatientProtocolsDialog` | Protocolos por paciente |

Lista exibe data de abertura; para concluídos, data de conclusão; para cancelados, data e justificativa.

---

## Validações importantes

| Campo | Validação | Onde |
|---|---|---|
| `patientId`, `protocolTypeId` | UUID válido | `protocol.validator.ts` |
| `protocolTypeId` | tipo deve existir e estar ativo | `protocol.service.ts` |
| `status` | `PENDENTE`, `CONCLUIDO` ou `CANCELADO` | `protocol.validator.ts` |
| `cancelReason` | obrigatório quando `status` = `CANCELADO` | `protocol.validator.ts` |
| Alteração de status | só permitida em protocolo `PENDENTE` | `protocol.service.ts` |

---

## Permissões

Todas as rotas de protocolos exigem autenticação e perfil `ADMINISTRADOR`.

---

## Arquivos principais

| Camada | Caminho |
|---|---|
| Schema | `backend/prisma/schema.prisma` (PatientProtocol, ProtocolType) |
| Service | `backend/src/services/protocol.service.ts` |
| Rotas | `backend/src/routes/protocols.routes.ts` |
| Validators | `backend/src/validators/protocol/` |
| Página | `frontend/src/pages/ProtocolsPage.jsx` |
| Feature | `frontend/src/features/protocols/` |
| Testes | `backend/tests/integration/protocols.test.ts` |

---

## Como testar

```bash
cd backend && npm run test:integration -- protocols.test.ts
```

Manual:
1. Abrir protocolo pendente → concluir → verificar data de conclusão na lista.
2. Abrir protocolo pendente → cancelar sem justificativa → erro 400.
3. Cancelar com justificativa → verificar status, data e motivo na lista.
4. Tentar alterar protocolo já concluído/cancelado → erro 400.
