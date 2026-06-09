# AGENTS

Guia de execução para agentes de IA neste repositório.

## Regra principal por contexto

1. Identifique o **módulo** afetado (agenda, patients, auth, users, cadastros, room-occupancy).
2. Leia a documentação do módulo em `docs/modules/<modulo>.md` (índice em `docs/modules/README.md`).
3. Leia as **skills** do escopo:
   - Frontend: `frontend/skills/README.md`
   - Backend: `backend/skills/README.md`
   - Fullstack: ambos + documentação do módulo

Antes de implementar, identifique o escopo (front/back/fullstack) e aplique skills + documentação do módulo.

## Documentação por módulo (obrigatório)

Cada módulo tem um arquivo em `docs/modules/` com regras de negócio, funcionalidades, validações, permissões e mapa de código.

| Módulo | Arquivo |
|---|---|
| Agenda | `docs/modules/agenda.md` |
| Pacientes | `docs/modules/patients.md` |
| Autenticação | `docs/modules/auth.md` |
| Usuários | `docs/modules/users.md` |
| Cadastros gerais | `docs/modules/cadastros.md` |
| Ocupação de salas | `docs/modules/room-occupancy.md` |

**Ao trabalhar em um módulo:**
- Ler o `.md` correspondente **antes** de alterar código.
- Atualizar o mesmo `.md` **depois** de mudanças funcionais (regras, rotas, validações, pendências).
- Módulo novo: copiar `docs/modules/_TEMPLATE.md`, preencher e registrar no índice.

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
   - Backend: integração em `backend/tests/integration/` e unitários em `backend/tests/unit/` (Vitest).
   - Frontend: se houver testes, adicionar/ajustar antes da implementação.
3. **Rodar testes e confirmar falha inicial** (red).
4. **Implementar a menor mudança possível**.
5. **Rodar testes novamente** (green).
6. **Refatorar sem quebrar testes**.
7. **Rodar validações finais**.

## Comandos de validação

### Backend

No diretório `backend/`:

- `npm test` — integração (Postgres de teste) + unitários, se existirem
- `npm run test:integration` — mesmo que `npm test` (só pasta `tests/integration/`)
- `npm run test:unit` — só `tests/unit/` (sem Docker)
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
- Toda alteração funcional deve atualizar `docs/modules/<modulo>.md` na mesma entrega.

