# Documentação — Gestão AMA Itajaí

## Documentação por módulo (fonte de verdade)

| Pasta | Conteúdo |
|---|---|
| [modules/README.md](./modules/README.md) | Índice de módulos — **ler antes de codar** |
| [modules/agenda.md](./modules/agenda.md) | Agenda: sessões, recorrência, conflitos, permissões |
| [modules/patients.md](./modules/patients.md) | Pacientes e desativação com impacto na agenda |
| [modules/auth.md](./modules/auth.md) | Autenticação (senha e Google) |
| [modules/users.md](./modules/users.md) | Funcionários e perfis |
| [modules/cadastros.md](./modules/cadastros.md) | Cadastros gerais (salas, tipos, modalidades) |
| [modules/room-occupancy.md](./modules/room-occupancy.md) | Visualização de ocupação de salas |

## Referência e histórico

| Arquivo | Conteúdo |
|---|---|
| [REGRAS-NEGOCIO-AGENDA.md](./REGRAS-NEGOCIO-AGENDA.md) | Regras iniciais validadas com a ONG (legado; ver `modules/agenda.md`) |
| [MODELAGEM-DADOS-AGENDA.md](./MODELAGEM-DADOS-AGENDA.md) | Entidades e campos do schema |
| [PROTOCOLO-IA.md](./PROTOCOLO-IA.md) | Regras para IA: ler módulos, codar e documentar |

**Última validação com a ONG:** 27/05/2026 (2 perfis principais: administrador/técnico, modalidades com limites, cadastro manual, Cadastros Gerais por administrador, Google Login e assinatura digital postergados).

**Stack:** backend em TypeScript · frontend em JavaScript.
