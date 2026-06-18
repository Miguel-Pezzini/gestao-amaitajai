# Módulo: Vendas

**Última atualização:** 2026-06-18  
**Escopo:** fullstack

---

## Visão geral

PDV de cantina/eventos da AMA: cadastro de produtos, registro de vendas com baixa automática de estoque, controle de fiados e listagem para conferência interna. Pagamentos são registrados manualmente (sem gateway Pix/cartão).

**Perfis:** `ADMINISTRADOR` (acesso clínico + vendas completo) e `OPERADOR` (somente módulo vendas).

---

## Regras de negócio

### Vendas

- Venda composta por itens do **catálogo de produtos** (quantidade, preço unitário snapshot, total da linha).
- Número sequencial anual: `AAAANNNNN` (mesmo padrão dos protocolos).
- Ao finalizar venda à vista: status `REGISTRADA`, baixa automática de `stockQty` de cada produto.
- Estoque insuficiente bloqueia a venda com erro específico por produto.
- Cancelamento (apenas admin): status `CANCELADA`, estorno de estoque, `cancelReason` obrigatório. Só vendas `REGISTRADA` ou `QUITADA`.

### Formas de pagamento

`PIX`, `DINHEIRO`, `DEBITO`, `CREDITO`, `FIADO`.

### Fiados

- Venda com `FIADO`: status `FIADO_PENDENTE`; `buyerName` e `promisedPayAt` obrigatórios.
- Estoque é baixado na venda fiada (mercadoria já saiu).
- Recebimento via `POST /sales/:id/payments`: atualiza `amountPaidCents`; status `QUITADA` quando quitado totalmente; parcial mantém `FIADO_PENDENTE`.

### Produtos

- Categoria, nome, preço de venda, custo opcional, estoque, estoque mínimo, ativo/inativo.
- Listagem em tabela: colunas produto, categoria, preço, custo, estoque (cor por nível), status e ações.
- Cores de estoque: vermelho abaixo do mínimo, amarelo no mínimo, verde acima do mínimo.
- Ordenação: ativos primeiro, depois nome; busca por nome/categoria (sem filtro de status).
- Apenas admin cadastra/edita produtos e categorias.

---

## Funcionalidades atuais

### Backend — rotas (`/sales/*`)

| Método | Rota | Permissão | Descrição |
|---|---|---|---|
| GET | `/sales/categories` | admin, operador | Lista categorias |
| POST | `/sales/categories` | admin | Criar categoria |
| PATCH | `/sales/categories/:id` | admin | Editar categoria |
| PATCH | `/sales/categories/:id/status` | admin | Ativar/inativar categoria |
| GET | `/sales/products` | admin, operador | Lista produtos |
| POST | `/sales/products` | admin | Criar produto |
| PATCH | `/sales/products/:id` | admin | Editar produto |
| PATCH | `/sales/products/:id/status` | admin | Ativar/inativar produto |
| GET | `/sales` | admin, operador | Lista vendas (filtros) |
| GET | `/sales/fiados` | admin, operador | Lista fiados pendentes/parciais |
| GET | `/sales/:id` | admin, operador | Detalhe da venda |
| POST | `/sales` | admin, operador | Finalizar venda |
| POST | `/sales/:id/payments` | admin, operador | Receber pagamento de fiado |
| PATCH | `/sales/:id/cancel` | admin | Cancelar venda |

### Frontend

| Rota | Componente | Permissão | Descrição |
|---|---|---|---|
| `/vendas` | `SalesListPage` | admin, operador | Listagem de vendas + dialog de nova venda (PDV) |
| `/vendas/produtos` | `ProductsPage` | admin | CRUD produtos (tabela + dialogs) |
| `/vendas/fiados` | `FiadosPage` | admin, operador | Fiados pendentes e recebimentos |

Nova venda abre em **dialog** na tela de Vendas (botão no header + FAB mobile), alinhado ao padrão do restante do sistema.

Rotas legadas `/vendas/nova` e `/vendas/lista` redirecionam para `/vendas`.

`OPERADOR` usa layout dedicado (`VendasLayout`) sem menu clínico. `ADMINISTRADOR` acessa vendas pelo menu principal.

---

## Validações importantes

| Campo/Regra | Validação | Onde |
|---|---|---|
| `items` | ao menos 1 item; productId UUID; quantity ≥ 1 | `sale.validator.ts` |
| `paymentMethod` | enum válido | `sale.validator.ts` |
| Fiado | `buyerName` e `promisedPayAt` obrigatórios | `sale.validator.ts` |
| Estoque | suficiente por produto | `sale.service.ts` |
| `cancelReason` | obrigatório no cancelamento | `sale.validator.ts` |
| Produto | preço ≥ 0; estoque ≥ 0 | `product.validator.ts` |

---

## Permissões

| Ação | administrador | operador | tecnico | recepcao |
|---|---|---|---|---|
| Registrar venda | sim | sim | não | não |
| Listar vendas / fiados | sim | sim | não | não |
| CRUD produtos/categorias | sim | não | não | não |
| Cancelar venda | sim | não | não | não |
| Receber fiado | sim | sim | não | não |

---

## Arquivos principais

| Camada | Caminho |
|---|---|
| Domínio | `backend/src/domain/sales.ts` |
| Rotas | `backend/src/routes/sales.routes.ts` |
| Services | `backend/src/services/product.service.ts`, `sale.service.ts` |
| Validators | `backend/src/validators/sales/` |
| Schema | `backend/prisma/schema.prisma` |
| Layout | `frontend/src/layouts/VendasLayout.jsx` |
| Config nav | `frontend/src/config/vendas-modules.js` |
| API client | `frontend/src/services/sales-api.js` |
| Nova venda | `frontend/src/features/vendas/components/NewSaleDialog.jsx`, `frontend/src/hooks/useNewSale.js` |
| Testes | `backend/tests/integration/sales.test.ts`, `sales-products.test.ts` |

---

## Pendências e fases futuras

- **Fase 3:** movimentações de estoque (compra, doação, perda, consumo interno); clientes reutilizáveis.
- **Fase 4:** dashboard (KPIs, gráficos do mockup ONG).
- **Fase 5:** relatórios com export PDF/Excel; lucro estimado.
- Backlog: eventos/campanhas, comprovante impresso, integração Pix.

---

## Como testar

```bash
cd backend && npm run test:integration -- sales
cd backend && npm run typecheck
cd frontend && npm run build
```

Manual:
1. Admin cadastra produto com estoque.
2. Operador finaliza venda Pix → estoque decrementa.
3. Venda fiada → aparece em `/vendas/fiados`; receber pagamento quita.
4. Técnico/recepção → 403 em `/sales`.
5. Admin cancela venda → estoque restaurado.
