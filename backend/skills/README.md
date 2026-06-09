# Backend Skills

Este diretório mapeia as skills de backend disponíveis no projeto.

## Ordem recomendada de leitura

1. `backend/skills/backend-service-structure/SKILL.md`
2. `backend/skills/backend-validation-extraction/SKILL.md`

## Quando usar cada skill

- `backend-service-structure`
  - Refatorar services grandes.
  - Separar orquestração de persistência.
  - Manter métodos públicos curtos e legíveis.

- `backend-validation-extraction`
  - Extrair validação de entrada de routes/services.
  - Centralizar validações em `validators/`.
  - Padronizar erros de validação.

## Documentação de módulo

Antes de alterar código de um domínio, ler `docs/modules/<modulo>.md` (ver índice em `docs/modules/README.md`).

Após mudanças funcionais, atualizar o mesmo arquivo com novas regras, rotas, validações ou pendências.

## Regra operacional

Em qualquer tarefa de backend, o agente deve:

1. Ler a documentação do módulo em `docs/modules/`.
2. Ler este README e as skills acima.
3. Atualizar `docs/modules/<modulo>.md` ao finalizar alterações funcionais.

