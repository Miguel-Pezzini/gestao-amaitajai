# TODO — Gestão AMA Itajaí

Checklist simples do que já está no sistema e do que falta. Para regras de negócio da agenda, ver [`docs/`](docs/).

**Legenda:** `[x]` feito · `[ ]` pendente

---

## Infraestrutura e acesso

- [x] API Express em TypeScript com Prisma e PostgreSQL
- [x] Autenticação (login, logout, sessão via cookie httpOnly + JWT)
- [x] Perfis `administrador` e `tecnico` com controle de acesso nas rotas
- [x] Layout do app com menu lateral e módulos configuráveis
- [ ] Login com Google corporativo
- [ ] Hospedagem e disponibilidade em produção

---

## Cadastro de pacientes

- [x] Cadastro com nome, nascimento, responsável, telefone e fonte de custeio
- [x] Edição e inativação lógica (sem apagar histórico)
- [x] Busca por nome ou responsável
- [x] Filtro por fonte de custeio (Municipal, Estadual, Particular)

---

## Cadastros gerais (administrador)

- [x] Salas
- [x] Modalidades de atendimento (individual, dupla, grupo)
- [x] Tipos de sessão (duração, modalidades permitidas)
- [x] Funcionários e perfis de acesso

---

## Agenda

- [x] Visualização por dia, semana e mês
- [x] Agendamento de sessões com pacientes, profissionais, sala e tipo
- [x] Modalidades individual, dupla e grupo (com limites configuráveis)
- [x] Bloqueio de conflito (profissional, paciente, sala)
- [x] Cancelamento com motivo
- [x] Técnico marca própria sessão como `realizada`
- [x] Ocupação das salas (visão semanal)
- [x] Recorrência semanal de sessões
- [ ] Filtro dedicado por profissional na UI (hoje o técnico já vê só a própria agenda)

---

## Presença e check-in

- [ ] Lista de presença diária automática a partir da agenda
- [ ] Registro de presença, falta e falta justificada
- [ ] Lista de presença semanal e impressão em A4
- [ ] Impressão antecipada da lista do dia seguinte
- [ ] Workflow híbrido (papel + registro digital) alinhado com convênios
- [ ] Check-in na recepção
- [ ] Painel de chegadas em tempo real para profissionais

---

## Fila de espera e serviço social

- [ ] Cadastro na fila vinculado ao paciente
- [ ] Prioridade (alta, média, baixa) e ordenação
- [ ] Histórico de tentativas de contato
- [ ] Campo de interesse imediato da família
- [ ] Perfil ou permissões específicas de serviço social

---

## Gestão, relatórios e conformidade

- [ ] Relatórios por profissional
- [ ] Relatórios por fonte de recurso
- [ ] Conceito de reposição de atendimento após falta
- [ ] Exportação editável para órgãos públicos
- [ ] Trilha de auditoria ampliada
- [ ] Perfil gestor institucional operacional

---

## Módulos clínicos (pós-MVP)

- [ ] Prontuário eletrônico e evolução dos atendimentos
- [ ] Anamnese
- [ ] Relatórios técnicos
- [ ] Plano Terapêutico Individual (PTI)
- [ ] Registro de intercorrências
- [ ] Assinatura digital (hoje: assinatura física)
- [ ] Portal ou app para responsáveis

---

## Validação com a ONG (pendente de reunião)

- [ ] Regras finais de grupo (mínimo de participantes)
- [ ] Trilhar 2x/semana — regra por paciente ou por turma
- [ ] Horário de funcionamento e slots fixos vs. livres
- [ ] Limites de duração do atendimento intensivo por caso

---

*Atualizado em junho/2026 conforme o código em `frontend/` e `backend/`.*
