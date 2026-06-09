# Documentação por módulo

Cada módulo do sistema tem um arquivo `.md` com regras de negócio, funcionalidades, validações e mapa de código.

## Índice

| Módulo | Arquivo | Escopo |
|---|---|---|
| Agenda | [agenda.md](./agenda.md) | fullstack |
| Pacientes | [patients.md](./patients.md) | fullstack |
| Autenticação | [auth.md](./auth.md) | fullstack |
| Usuários / Funcionários | [users.md](./users.md) | fullstack |
| Cadastros gerais | [cadastros.md](./cadastros.md) | fullstack |
| Ocupação de salas | [room-occupancy.md](./room-occupancy.md) | frontend |

## Regra para agentes de IA

1. **Antes de alterar um módulo**, ler o `MODULE.md` correspondente nesta pasta.
2. **Depois de alterar comportamento**, atualizar o mesmo arquivo na mesma entrega.
3. Se criar um módulo novo, copiar [`_TEMPLATE.md`](./_TEMPLATE.md) e registrar aqui no índice.

## Documentação legada

Estes arquivos ainda existem como referência histórica, mas a fonte de verdade por módulo é esta pasta:

- [REGRAS-NEGOCIO-AGENDA.md](../REGRAS-NEGOCIO-AGENDA.md) — consolidado em `agenda.md`
- [MODELAGEM-DADOS-AGENDA.md](../MODELAGEM-DADOS-AGENDA.md) — detalhes de schema; agenda cobre o essencial
