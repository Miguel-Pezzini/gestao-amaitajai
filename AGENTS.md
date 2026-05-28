# AGENTS

Guia de execução para agentes de IA neste repositório.

## Regra principal por contexto

- Se a tarefa for **frontend**, leia primeiro os arquivos em `frontend/skills/`.
- Se a tarefa for **backend**, leia primeiro os arquivos em `backend/skills/`.
- Se a tarefa envolver os dois lados, leia ambos.

Antes de implementar, identifique o escopo (front/back/fullstack) e aplique as skills mapeadas.

## Mapeamento de skills do projeto

As skills oficiais deste repositório vivem nas pastas locais de domínio:

- Frontend: `frontend/skills/README.md`
- Backend: `backend/skills/README.md`

## Padrão de desenvolvimento (TDD)

Para cada feature ou fix, seguir este ciclo:

1. **Definir cenário de aceitação**
   - O que deve funcionar.
   - O que deve falhar (erro esperado).
2. **Escrever/ajustar teste primeiro**
   - Backend: integração e/ou unitário (Vitest).
   - Frontend: se houver testes, adicionar/ajustar antes da implementação.
3. **Rodar testes e confirmar falha inicial** (red).
4. **Implementar a menor mudança possível**.
5. **Rodar testes novamente** (green).
6. **Refatorar sem quebrar testes**.
7. **Rodar validações finais**.

## Comandos de validação

### Backend

No diretório `backend/`:

- `npm test`
- `npm run typecheck`

### Frontend

No diretório `frontend/`:

- `npm run build`

Observação: atualmente o frontend não possui script de teste no `package.json`. Ao introduzir testes, incluir script de teste e integrar ao ciclo TDD.

## Regras de qualidade

- Manter validações de entrada no domínio apropriado (ex.: validators no backend).
- Evitar funções de service com muitas responsabilidades.
- Erros devem ser específicos por tipo de falha.
- Toda alteração funcional deve vir acompanhada de cobertura de teste adequada.

