# Módulo: Cadastros gerais

**Última atualização:** 2026-06-10  
**Escopo:** fullstack

---

## Visão geral

Telas administrativas para dados mestres usados pela agenda, pacientes e protocolos: salas, tipos de sessão (modalidades de atendimento), formatos de sessão (individual/dupla/grupo), tipos de protocolo, fontes de custeio de pacientes e funcionários. As APIs de salas, tipos e modalidades ficam no módulo **Agenda**; tipos de protocolo no módulo **Protocolos**; fontes de custeio no módulo **Pacientes**; funcionários no módulo **Usuários**.

---

## Regras de negócio

### Salas

- Nome único.
- Podem ser ativadas/desativadas (`isActive`). Sala inativa não deve ser usada em novos agendamentos.

### Tipos de sessão (`SessionType`)

- Nome, slug (gerado automaticamente), duração padrão, `isDurationFlexible`, modalidades permitidas.
- Slug `tea-14-plus`: apenas modalidade `grupo`.
- Ativação/desativação via status.

### Formatos de sessão (`SessionModalitySetting`)

- Configura limites min/max de pacientes e profissionais por modalidade (individual, dupla, grupo).
- Valores default criados automaticamente pelo service se não existirem.
- Alteração afeta validação de novas sessões.

### Tipos de protocolo (`ProtocolType`)

- Nome único, cadastrado pelo administrador.
- Ativação/desativação via status (`isActive`).
- Tipos inativos não aparecem ao abrir novos protocolos, mas permanecem visíveis em protocolos já registrados.

### Fontes de custeio (`PatientFundingSource`)

- Nome único, cadastrado pelo administrador.
- Ativação/desativação via status (`isActive`).
- Fontes inativas não aparecem ao cadastrar novos pacientes, mas permanecem visíveis em pacientes já vinculados.

### Funcionários

Documentados em [users.md](./users.md).

---

## Funcionalidades atuais

### Backend

APIs sob `/agenda/*` — ver [agenda.md](./agenda.md) (rotas de rooms, session-types, session-modalities).

APIs de tipos de protocolo sob `/protocol-types` — ver rotas em `protocols.routes.ts`.

APIs de fontes de custeio sob `/funding-sources` — ver rotas em `patient-funding-sources.routes.ts`.

### Frontend

| Rota | Página | Descrição |
|---|---|---|
| `/cadastros/salas` | `SalasPage` | CRUD salas |
| `/cadastros/tipos-sessao` | `TiposSessaoPage` | CRUD tipos de atendimento |
| `/cadastros/modalidades` | `ModalidadesPage` | Editar limites por formato (individual/dupla/grupo) |
| `/cadastros/tipos-protocolo` | `TiposProtocoloPage` | CRUD tipos de solicitação de protocolo |
| `/cadastros/tipos-custeio` | `TiposCusteioPage` | CRUD fontes de custeio de pacientes |
| `/cadastros/funcionarios` | `UsuariosPage` | CRUD funcionários |

Todas as rotas de cadastro exigem `RequireAdminRoute`.

Constantes compartilhadas: `frontend/src/features/cadastros/constants.js` (labels de modalidade e role).

**Listas de cadastro:** ações por item (`Editar`, `Inativar`/`Reativar`) usam ícones com tooltip no hover via `EntityListIconAction` (mesmo padrão da lista de usuários na UI).

---

## Validações importantes

| Entidade | Validação | Arquivo |
|---|---|---|
| Sala | nome obrigatório, único | `room.validator.ts` |
| Tipo sessão | nome, duração > 0, ≥1 modalidade | `session-type.validator.ts` |
| Modalidade setting | min ≤ max, todos > 0 | `session-modality-setting.validator.ts` |
| Tipo de protocolo | nome obrigatório, único | `protocol-type.validator.ts` |
| Fonte de custeio | nome obrigatório, único | `patient-funding-source.validator.ts` |

---

## Permissões

| Tela | administrador | tecnico |
|---|---|---|
| Todas em `/cadastros/*` | sim | não (rota bloqueada) |

---

## Arquivos principais

| Camada | Caminho |
|---|---|
| Páginas | `frontend/src/pages/cadastros/*.jsx` |
| Constantes | `frontend/src/features/cadastros/constants.js` |
| APIs (backend) | `backend/src/routes/agenda.routes.ts`, `backend/src/routes/protocols.routes.ts`, `backend/src/routes/patient-funding-sources.routes.ts` |
| Validators | `backend/src/validators/agenda/room.validator.ts`, `session-type.validator.ts`, `session-modality-setting.validator.ts`, `protocol-type.validator.ts`, `patient-funding-source.validator.ts` |

---

## Pendências e decisões abertas

- Lista inicial de salas/tipos será cadastrada pela equipe (não bloqueia MVP).
- Seed automatizado de tipos padrão da ONG.

---

## Como testar

Manual:
1. Admin acessa cada tela de cadastro → lista e formulários funcionam.
2. Criar tipo com modalidade inválida para tea-14-plus → erro.
3. Alterar limites de grupo (ex.: max pacientes) → refletir na criação de sessão.
