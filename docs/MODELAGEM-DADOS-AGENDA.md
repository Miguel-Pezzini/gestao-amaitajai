# Modelagem de Dados — Agenda (MVP)

Versão enxuta para implementação imediata.

**Última atualização:** 27/05/2026  
**Fonte funcional:** [REGRAS-NEGOCIO-AGENDA.md](./REGRAS-NEGOCIO-AGENDA.md)

---

## 1) Entidades principais

### `User`
- `name`
- `email`
- `passwordHash`
- `role`: `administrador` | `tecnico`
- `isActive`

### `Room` (Cadastro Geral)
- `name`
- `code` (opcional)
- `isActive`

### `SessionType` (Cadastro Geral)
- `name`
- `slug`
- `defaultDurationMinutes`
- `isDurationFlexible`
- `allowedModalities`: `individual` | `dupla` | `grupo`
- `isActive`

### `Session`
- `sessionTypeId`
- `modality`
- `roomId`
- `startAt`
- `endAt`
- `durationMinutes`
- `status`: `agendada` | `realizada` | `cancelada`
- `patientIds[]`
- `professionalIds[]`
- `notes` (opcional)
- `createdBy`
- `updatedBy`
- `cancelledAt` / `cancelReason` (quando cancelada)

---

## 2) Regras de validação

### Por modalidade
| Modalidade | Pacientes | Profissionais |
|---|---|---|
| `individual` | 1 | 1 |
| `dupla` | 2 | 2 |
| `grupo` | 1 a 15 | 2 a 4 |

### Conflitos (bloquear no backend)
- profissional em sobreposição
- paciente em sobreposição
- sala em sobreposição

### Permissões
- `administrador`: CRUD completo de sessão + cadastros gerais
- `tecnico`: apenas marcar `status=realizada` na própria sessão

---

## 3) Regras especiais de tipo

- `tea-14-plus`: apenas modalidade `grupo`
- `intensivo`: padrão 60 min, ajuste permitido por caso

---

## 4) Índices sugeridos (MongoDB)

```javascript
{ startAt: 1, endAt: 1 }
{ professionalIds: 1, startAt: 1 }
{ patientIds: 1, startAt: 1 }
{ roomId: 1, startAt: 1, endAt: 1 }
```

---

## 5) Fora do escopo imediato

- Recorrência semanal
- Login Google
- Assinatura digital

---

## 6) Pendências curtas (negócio)

- Grupo tem mínimo obrigatório além de 1?
- Trilhar 2x/semana é regra rígida ou recomendação?
- Horários livres ou slots fixos?
- Horário de funcionamento oficial da clínica
