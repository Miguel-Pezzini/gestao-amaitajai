# Protocolo de Implementação com IA

Objetivo: manter consistência técnica e documentação viva durante o desenvolvimento.

## Regras obrigatórias para a IA

1. **Ler antes de codar**
   - Sempre ler:
     - `docs/REGRAS-NEGOCIO-AGENDA.md`
     - `docs/MODELAGEM-DADOS-AGENDA.md`
     - `docs/README.md`
   - Se houver conflito entre código e docs, priorizar os docs e sinalizar divergência.

2. **Documentar toda feature**
   - A cada feature implementada, criar um arquivo:
     - `docs/features/YYYY-MM-DD-<slug-da-feature>.md`
   - Conteúdo mínimo:
     - objetivo
     - arquivos alterados
     - regras aplicadas
     - decisões tomadas
     - pendências
     - como testar manualmente

3. **Não implementar fora do escopo atual**
   - Não implementar sem alinhamento prévio:
     - login Google
     - assinatura digital
     - recorrência semanal

4. **Permissões sempre primeiro**
   - Toda rota nova deve respeitar roles:
     - `administrador`
     - `tecnico`
   - Toda ação sensível deve registrar auditoria (`createdBy`, `updatedBy`, etc.).

5. **Atualizar docs ao final**
   - Depois de implementar, atualizar os docs centrais se houver mudança de regra:
     - `REGRAS-NEGOCIO-AGENDA.md`
     - `MODELAGEM-DADOS-AGENDA.md`

6. **Testes são obrigatórios em toda entrega**
   - Toda feature nova, correção ou refatoração deve incluir criação ou ajuste de testes.
   - Priorizar testes de integração com banco real e aplicação real (fluxo HTTP completo), evitando depender apenas de mocks.
   - Só considerar tarefa concluída após rodar testes da mudança e manter o backend compilando.

