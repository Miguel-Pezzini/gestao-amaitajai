---
name: backend-service-structure
description: >-
  Organizar services em métodos públicos finos que delegam para funções privadas
  ou validators. Use ao criar ou refatorar services no backend.
disable-model-invocation: true
---

# Estrutura de services no backend

## Objetivo

Cada método público do service deve ser **fácil de ler em poucas linhas**: validar → carregar → aplicar regra → persistir → retornar.

## Regras

1. **Método público = orquestração** — não misturar normalização, validação, query e `save` no mesmo bloco longo.
2. **Extrair passos nomeados** em métodos privados ou módulos auxiliares:
   - `validateCreateRoomInput` (validator)
   - `findRoomOrThrow` / `findSessionOrThrow`
   - `persistRoomCreate` / `applySessionUpdates`
   - `assertNoSchedulingConflicts`
3. **Um conceito por função** — se a função faz duas coisas independentes, dividir.
4. **Erros específicos** — `ValidationError`, `NotFoundError`, `ConflictError`, `ForbiddenError` em `errors/http-errors.ts`; evitar `new AppError(status, msg)` no service.
5. **Tamanho alvo** — método público idealmente &lt; 25 linhas; arquivo de service grande é aceitável se bem fatiado.

## Fluxo típico (criar sessão)

```
createSession
  → normalizeSessionInput + validateSessionInput   (validators)
  → loadSessionReferences                          (service + DB)
  → ensureSessionTypeSupportsModality              (validator)
  → computeSessionEndAt                            (service)
  → assertNoSchedulingConflicts                    (service + DB)
  → Session.create                                 (persist)
```

## Anti-padrões

- Método de 80+ linhas com validação, queries e updates misturados.
- Duplicar a mesma sequência em `create` e `update` sem extrair `applySessionUpdates` / pipeline compartilhado.
- Lançar `AppError` direto em vez das subclasses HTTP.

## Checklist antes de finalizar

- [ ] Cada endpoint público do service tem fluxo legível de cima a baixo.
- [ ] Validação de entrada está em `validators/`.
- [ ] Erros usam classes em `http-errors.ts`.
- [ ] Testes de integração cobrem happy path e erros principais por recurso.
