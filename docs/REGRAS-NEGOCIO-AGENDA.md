# Regras de Negócio — Agenda (MVP)

Resumo objetivo do que já está decidido para começar a implementação.

**Última atualização:** 27/05/2026  
**Modelagem técnica:** [MODELAGEM-DADOS-AGENDA.md](./MODELAGEM-DADOS-AGENDA.md)

---

## 1) Escopo do MVP (agora)

- Agenda institucional (dia/semana)
- Cadastros gerais (admin)
- Controle de sessão (criar/editar/cancelar por admin)
- Técnico só confirma execução da própria sessão (`realizada`)

Fora do escopo imediato:
- Recorrência semanal
- Login Google
- Assinatura digital

---

## 2) Perfis e permissões

### `administrador`
- Gerencia agenda completa
- Cadastra dados mestres em **Cadastros Gerais**
- Pode criar, editar, cancelar sessões

### `tecnico`
- Vê apenas a própria agenda
- Pode apenas marcar execução da própria sessão (`realizada`)
- Não altera horário, sala, pacientes ou profissionais

---

## 3) Regras de sessão

Uma sessão possui: data/hora, duração, sala, tipo/modalidade, pacientes e profissionais.

| Modalidade | Pacientes | Profissionais |
|---|---|---|
| Individual | 1 | 1 |
| Dupla | 2 | 2 |
| Grupo | 1 a 15 | 2 a 4 |

Regras de conflito (bloqueio):
- Profissional não pode sobrepor sessão
- Paciente não pode sobrepor sessão
- Sala não pode sobrepor sessão

---

## 4) Tipos de atendimento confirmados

| Tipo | Duração padrão |
|---|---:|
| PSICOPED | 30 min |
| INTENSIVO | 60 min (pode variar por caso) |
| INTERVENÇÃO PRECOCE | 90 min |
| Grupo de Habilidades Sociais | 60 min |
| TEA 14+ | 120 min |
| Trilhar | 60 min (expectativa 2x semana) |

Regra fechada:
- `TEA 14+` é somente `grupo`

---

## 5) Cadastros Gerais (admin)

Menu de cadastros gerais para:
- Salas
- Modalidades / tipos de sessão
- Usuários e perfis
- Demais parâmetros institucionais

Observação: lista inicial de salas/tipos **não bloqueia** o início, pois será cadastrada internamente pela equipe.

---

## 6) Pendências para conversar com a ONG

- Grupo: existe mínimo obrigatório além do máximo 15?
- Trilhar 2x/semana: regra por paciente, por turma ou só referência?
- Horários de operação: livres ou slots fixos?
- Horário de funcionamento (início/fim, dias)
- Intensivo com ajuste por caso: quem pode ajustar e limite mínimo/máximo

---

## 7) Fases futuras (não bloquear agora)

- Login com Google corporativo
- Assinatura digital (manter assinatura física por enquanto)
- Recorrência semanal de sessões
