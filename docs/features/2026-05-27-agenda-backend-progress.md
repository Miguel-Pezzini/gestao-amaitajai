# Agenda Backend MVP - Progresso

**Data de início:** 27/05/2026  
**Objetivo:** implementar apenas o que já está fechado para agenda no MVP.

## Tarefas pequenas

### 1) Base de permissões
- [x] Adicionar `role` (`administrador` | `tecnico`) no `User`.
- [x] Adicionar `isActive` no `User`.
- [x] Garantir que usuário admin inicial seja criado como `administrador`.
- [x] Retornar `role` e `isActive` no login.
- [x] Bloquear autenticação de usuário inativo.

### 2) Modelagem mínima da agenda
- [x] Criar model `Room` (cadastro geral).
- [x] Criar model `SessionType` (tipo + modalidades permitidas).
- [x] Criar model `Session` (agenda).
- [x] Aplicar enums de modalidade e status.
- [x] Aplicar validações por modalidade (individual/dupla/grupo).
- [x] Aplicar índices para consulta e conflitos.

### 3) API inicial da agenda
- [x] Expor rotas de `rooms` (listar, criar).
- [x] Expor rotas de `session-types` (listar, criar).
- [x] Expor rotas de `sessions` (listar, criar, editar, cancelar, concluir).
- [x] Restringir criação/edição/cancelamento para `administrador`.
- [x] Permitir técnico concluir apenas sessão própria.
- [x] Bloquear conflitos de sala/profissional/paciente por sobreposição.

### 4) Integração e verificação
- [x] Registrar módulo de agenda no roteador principal.
- [x] Rodar `npm run typecheck`.
- [x] Rodar `npm run build`.
- [x] Ajustar erros de compilação/lint, se houver.

### 5) Refatoração estrutural (service + middleware)
- [x] Mover regra de negócio da agenda para `AgendaService`.
- [x] Deixar `agenda.routes.ts` apenas como camada HTTP.
- [x] Criar middleware de autorização por role (`requireRole`, `requireAdmin`).
- [x] Remover validação de admin inline nas rotas.

### 6) Testes de integração
- [x] Configurar Vitest + Supertest para integração.
- [x] Criar suíte de integração para agenda (autorização, conflito e conclusão de sessão).
- [ ] Executar suíte de integração com MongoDB real disponível.

## Registro curto de execução

- **Feito agora:** refatoração `routes -> services`, autorização via middleware e suíte de integração criada.
- **Em andamento:** execução da suíte de integração em ambiente com MongoDB real ativo.
- **Próximo passo sugerido:** subir MongoDB local (ou apontar `MONGODB_URI`) e rodar `npm run test`.
