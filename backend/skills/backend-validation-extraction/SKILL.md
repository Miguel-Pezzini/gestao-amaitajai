---
name: backend-validation-extraction
description: >-
  Extrair validação de entrada para módulos validators/ em vez de validar inline
  em services ou routes. Use ao criar ou refatorar services, rotas ou regras de
  negócio no backend.
disable-model-invocation: true
---

# Extração de validação no backend

## Objetivo

Services orquestram fluxo e persistência. **Validação de entrada** fica em `validators/<domínio>/`, em **uma função `validate*` por operação**, com `if` simples em sequência — sem espalhar micro-funções exportadas.

## Regras

1. **Um `validate` por caso de uso** — ex.: `validateCreateSessionType`, `validateUpdateSessionType`, `validateSession`, `validateCancelSession`.
2. **Dentro da função: `if` diretos**, como no código original (3 ifs, 5 ifs, etc.). Evitar `assertX`, `parseY`, `validateZ` exportados só para um `if`.
3. **Service chama `validate` uma vez** no início do fluxo e segue com persistência.
4. **Utils** (`normalizeText`, `parseDate`) ficam em `agenda.utils.ts`; não são “validação de negócio”.
5. **Validators lançam `ValidationError`** (ou erro HTTP específico).

## Exemplo (tipo de sessão)

```typescript
export function validateCreateSessionType(payload: { ... }) {
  const name = normalizeText(payload.name);
  const slug = slugify(name);
  const defaultDurationMinutes = Number.parseInt(String(payload.defaultDurationMinutes), 10);
  const allowedModalities = parseAllowedModalities(payload.allowedModalities);

  if (!name || !slug || !Number.isFinite(defaultDurationMinutes) || defaultDurationMinutes <= 0) {
    throw new ValidationError("Dados inválidos para tipo de sessão.");
  }
  if (allowedModalities.length === 0) {
    throw new ValidationError("Informe ao menos uma modalidade permitida.");
  }
  if (slug === "tea-14-plus" && allowedModalities.some((item) => item !== "grupo")) {
    throw new ValidationError("Tipo tea-14-plus permite apenas modalidade grupo.");
  }

  return { name, slug, defaultDurationMinutes, ... };
}
```

```typescript
async createSessionType(payload) {
  const input = validateCreateSessionType(payload);
  const sessionType = await SessionType.create(input);
  return { sessionType };
}
```

## O que fica no service

- Consultas ao banco (existência, conflito de horário).
- Persistência e regras que dependem de estado já carregado (ex.: técnico só conclui a própria sessão).

## Checklist

- [ ] Cada operação pública chama um único `validate*` antes de persistir.
- [ ] Validators legíveis: blocos de `if` + `throw`, sem over-engineering.
- [ ] Testes de integração cobrem erros principais.
