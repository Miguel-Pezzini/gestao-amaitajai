# Protocolo de Implementação com IA

Objetivo: manter consistência técnica e documentação viva durante o desenvolvimento.

## Regras obrigatórias para a IA

1. **Ler antes de codar**
   - Identificar o módulo afetado.
   - Ler `docs/modules/<modulo>.md` (índice em `docs/modules/README.md`).
   - Ler skills do escopo (`backend/skills/`, `frontend/skills/`) e `AGENTS.md`.
   - Se houver conflito entre código e documentação do módulo, priorizar o `.md` do módulo e sinalizar divergência.

2. **Atualizar documentação do módulo**
   - Toda alteração funcional deve atualizar `docs/modules/<modulo>.md` na mesma entrega.
   - Conteúdo a manter atualizado:
     - regras de negócio
     - funcionalidades (rotas, telas, fluxos)
     - validações importantes
     - permissões
     - arquivos principais
     - pendências
     - como testar
   - Módulo novo: copiar `docs/modules/_TEMPLATE.md` e registrar no índice.

3. **Documentar features significativas (opcional/complementar)**
   - Para entregas grandes ou decisões arquiteturais, criar também:
     - `docs/features/YYYY-MM-DD-<slug-da-feature>.md`
   - Conteúdo mínimo: objetivo, arquivos alterados, decisões, pendências, teste manual.

4. **Permissões sempre primeiro**
   - Toda rota nova deve respeitar roles: `administrador`, `tecnico`.
   - Toda ação sensível deve registrar auditoria (`createdBy`, `updatedBy`, etc.).

5. **Testes são obrigatórios em toda entrega**
   - Toda feature nova, correção ou refatoração deve incluir criação ou ajuste de testes.
   - Priorizar testes de integração com banco real e aplicação real (fluxo HTTP completo).
   - Só considerar tarefa concluída após rodar testes da mudança e manter o backend compilando.

6. **Frontend componentizado (obrigatório)**
   - Evitar arquivos de página/view muito longos (referência: até ~250 linhas por arquivo de página).
   - Extrair lógica para hooks (`src/hooks`) e blocos de UI para componentes por feature (`src/features/<feature>/components`).
   - Rodar build do frontend após refatorações estruturais.

## Módulos documentados

| Módulo | Arquivo |
|---|---|
| Agenda | `docs/modules/agenda.md` |
| Pacientes | `docs/modules/patients.md` |
| Autenticação | `docs/modules/auth.md` |
| Usuários | `docs/modules/users.md` |
| Cadastros | `docs/modules/cadastros.md` |
| Ocupação de salas | `docs/modules/room-occupancy.md` |
