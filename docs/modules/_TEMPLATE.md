# Módulo: <nome>

> Copie este arquivo para `docs/modules/<nome>.md` ao documentar um novo módulo.

**Última atualização:** YYYY-MM-DD  
**Escopo:** backend | frontend | fullstack

---

## Visão geral

Breve descrição do propósito do módulo e quem usa.

---

## Regras de negócio

- Regra 1
- Regra 2

---

## Funcionalidades atuais

### Backend (se aplicável)

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/exemplo` | autenticado | ... |

### Frontend (se aplicável)

| Rota | Página/Componente | Permissão | Descrição |
|---|---|---|---|
| `/exemplo` | `ExemploPage` | admin | ... |

---

## Validações importantes

| Campo/Regra | Validação | Onde |
|---|---|---|
| ... | ... | `validators/...` |

---

## Permissões

| Ação | administrador | tecnico |
|---|---|---|
| ... | sim | não |

---

## Arquivos principais

| Camada | Caminho |
|---|---|
| Rotas | `backend/src/routes/...` |
| Service | `backend/src/services/...` |
| Validators | `backend/src/validators/...` |
| Página | `frontend/src/pages/...` |
| Feature | `frontend/src/features/...` |
| Testes | `backend/tests/...` |

---

## Pendências e decisões abertas

- Item pendente de alinhamento com a ONG ou implementação futura.

---

## Como testar

1. Passo manual ou comando de teste.
2. Cenário de erro esperado.
