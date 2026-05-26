# TODO — Lacunas entre REQUISITOS.md e demandas da AMA Itajaí

Documento de acompanhamento das diferenças entre o levantamento consolidado em [`REQUISITOS.md`](REQUISITOS.md) e o texto institucional enviado pela ONG (contato formal por eixo temático).

**Legenda de status**

| Status | Significado |
|---|---|
| ✅ Coberto | Já documentado no REQUISITOS.md (MVP ou futuro) |
| ⚠️ Parcial | Mencionado de forma incompleta ou com prioridade divergente |
| ❌ Ausente | Demandado pela ONG e não consta no REQUISITOS.md |
| 🔮 Futuro | Reconhecido no REQUISITOS.md como fora do escopo do MVP |

---

## 1. Eixo Administrativo e de Recepção

| # | Demanda da ONG | Status no REQUISITOS.md | Ação |
|---|---|---|---|
| 1.1 | Agenda por dias e horários dos profissionais | ✅ RF06, RF07, RF08 | — |
| 1.2 | Agenda visual intuitiva (estilo calendário digital) | ✅ RF06 | Validar protótipo de UI com a recepção |
| 1.3 | Atendimentos **individuais e em grupo**, com **abas para grupos terapêuticos** e vínculo de **múltiplas crianças** | ❌ Apenas atendimentos individuais (RF07) | Incluir requisitos de agendamento em grupo; definir modelo de dados (grupo, participantes, abas na agenda) |
| 1.4 | Listas de presença diárias automatizadas | ✅ RF11 | — |
| 1.5 | Listas de presença **semanais** automatizadas | ⚠️ RF15 (prioridade Média) | Confirmar se entra no MVP; ONG trata como rotina administrativa central |
| 1.6 | **Impressão antecipada** das listas do **dia seguinte** para coleta de assinaturas | ⚠️ RF14 / UC05 (impressão genérica) | Explicitar fluxo “gerar lista de amanhã”; adicionar atalho/agendamento de impressão |
| 1.7 | Registro de presença semanal com **assinatura física** dos responsáveis (modelo híbrido digital + papel) | ⚠️ UC05 cita assinatura física; sem fluxo semanal dedicado | Documentar workflow híbrido completo: imprimir → assinar → registrar digitalmente |
| 1.8 | Check-in de chegada das famílias | ✅ RF16 | — |
| 1.9 | Painel em tempo real para profissionais acompanharem chegadas | ✅ RF17, RF18 | — |
| 1.10 | Classificação por fonte de custeio (particular, municipal, estadual) | ✅ RF01, RF05, RF09 | — |
| 1.11 | Controle de faltas com justificativas | ✅ RF12, RF13 | — |
| 1.12 | Modelo híbrido obrigatório por exigência de convênios públicos | ⚠️ Implícito em UC05; não é RNF explícito | Adicionar RNF ou nota de conformidade sobre presença física + registro digital |

---

## 2. Eixo da Equipe Terapêutica

| # | Demanda da ONG | Status no REQUISITOS.md | Ação |
|---|---|---|---|
| 2.1 | Registro sistematizado da evolução dos atendimentos | 🔮 Quadro 16 (prontuário) | Backlog pós-MVP |
| 2.2 | Elaboração e armazenamento de relatórios técnicos | 🔮 Quadro 16 | Backlog pós-MVP |
| 2.3 | Prontuário eletrônico com histórico de atendimentos | 🔮 Quadro 16 | Backlog pós-MVP |
| 2.4 | Cadastro e armazenamento de **anamnese** dos associados | 🔮 Quadro 16 | Backlog pós-MVP |
| 2.5 | Vinculação profissional–paciente com **atendimento compartilhado** (dois ou mais profissionais) | ❌ RF07 prevê um profissional por agendamento | Definir se entra no MVP ou backlog; modelar co-terapia / profissionais múltiplos |
| 2.6 | Visualização do status de chegada na rotina terapêutica | ✅ RF18 | — |
| 2.7 | Registro de **intercorrências** relevantes durante atendimentos | ❌ Não documentado | Incluir requisito (módulo clínico leve ou campo no atendimento); alinhar escopo |
| 2.8 | **Plano Terapêutico Individual** (metas e evolução clínica) | 🔮 Quadro 16 | Backlog pós-MVP |

---

## 3. Eixo do Serviço Social e Gestão de Vagas

| # | Demanda da ONG | Status no REQUISITOS.md | Ação |
|---|---|---|---|
| 3.1 | Cadastro integrado de pacientes | ✅ RF01–RF04 | — |
| 3.2 | Fila de espera vinculada aos cadastros | ✅ RF19 | — |
| 3.3 | Histórico de **contatos com famílias** (eixo social, não só fila) | ⚠️ RF22 limitado a tentativas na fila | Expandir escopo: contatos gerais do serviço social ou manter só na fila? Validar com ONG |
| 3.4 | Campo: família demonstra **interesse imediato** em ingressar | ⚠️ RF23 (prioridade **Baixa**) | Revisar prioridade — ONG destaca explicitamente no eixo social |
| 3.5 | Histórico de tentativas de contato (data, horário, responsável) | ⚠️ RF22 (prioridade Média) | Confirmar campos e se entra no MVP |
| 3.6 | Classificação de **prioridade** para vagas | ✅ RF20, RF21 | — |
| 3.7 | Perfil **Serviço Social** com permissões específicas | ❌ Quadro 2 só: Recepcionista, Terapeuta, Gestor | Avaliar terceiro perfil ou permissões do administrativo para fila/contatos |

---

## 4. Eixo de Gestão Institucional e Prestação de Contas

| # | Demanda da ONG | Status no REQUISITOS.md | Ação |
|---|---|---|---|
| 4.1 | Relatórios automatizados de atendimentos **por profissional** | 🔮 Gestor “versões futuras”; sem RF | Backlog; especificar métricas e periodicidade |
| 4.2 | Relatórios por **fonte de recurso** (municipal, estadual, particular) | 🔮 Quadro 16 “relatórios financeiros” | Backlog; RF05 é filtro de listagem, não relatório |
| 4.3 | Consolidação de presença, faltas e **reposições** | ❌ “Reposições” não aparece em lugar nenhum | Incluir conceito de reposição (agendamento/remarcação pós-falta?) e relatório consolidado |
| 4.4 | Exportação em **formatos editáveis** para órgãos públicos | 🔮 Quadro 16 | Backlog; definir formatos (CSV, XLSX, ODS) |
| 4.5 | Histórico de registros para **auditorias** e controle interno | ⚠️ RF03 (exclusão lógica); sem trilha de auditoria | Avaliar log de alterações / relatório de auditoria no MVP ou futuro |
| 4.6 | Perfil **Gestor Institucional** operacional | ⚠️ Quadro 2 — funcionalidade futura | Alinhar expectativa: MVP sem relatórios ou entregar relatório mínimo? |

---

## 5. Requisitos transversais (ambos os documentos)

| # | Demanda da ONG | Status no REQUISITOS.md | Ação |
|---|---|---|---|
| 5.1 | Múltiplos **níveis de acesso** por perfil profissional | ✅ RNF04, RNF05, Quadro 2 | Revisar se perfis cobrem todos os setores (social, gestão) |
| 5.2 | Plataforma **online** com acesso remoto | ✅ RNF01 | — |
| 5.3 | Priorizar sistema **interno**; portal/app para responsáveis em etapa futura | ✅ Quadro 16 + nota ONG | — |
| 5.4 | Acesso remoto também para **famílias** | ⚠️ RNF01 menciona “profissionais e famílias”; ONG adia portal externo | Corrigir RNF01 para refletir escopo interno no MVP |
| 5.5 | Rigor em registros, rastreabilidade, categorização para prestação de contas | ⚠️ Parcialmente (fonte custeio, presença) | Consolidar como objetivo não funcional ou critério de aceite |

---

## 6. Itens no REQUISITOS.md sem correspondência explícita na carta da ONG

Estes pontos foram acrescentados pela equipe (benchmark, MVP técnico ou detalhamento). Manter, mas validar com a instituição se necessário.

| ID | Item | Observação |
|---|---|---|
| RF03 | Inativação lógica de paciente | Boa prática; ONG não menciona explicitamente |
| RF10 | Cancelamento de agendamento com motivo | Detalhamento operacional da agenda |
| RF04 | Busca por nome ou responsável | Detalhamento de usabilidade |
| RNF02–RNF03 | Usabilidade e responsividade | Critérios de qualidade da equipe |
| RNF07 | Disponibilidade em horário de funcionamento | Infraestrutura / hospedagem |
| Seção 2.3 | Benchmark de mercado (Ninsaúde, iClinic, etc.) | Metodologia acadêmica; não veio da ONG |
| UC03 fluxo alt. | Notificação se lista de presença incompleta | Proposta da equipe; confirmar desejabilidade |

---

## 7. Prioridades sugeridas para alinhamento com a ONG

### Confirmar no MVP (lacunas ou ⚠️ com impacto operacional alto)

- [ ] **Agendamento em grupo** com abas e múltiplos pacientes (1.3)
- [ ] **Impressão antecipada** da lista do dia seguinte (1.6)
- [ ] **Workflow híbrido** presença semanal documentado de ponta a ponta (1.7, 1.12)
- [ ] **Reposições** — definir regra de negócio e se entram no MVP (4.3)
- [ ] Revisar prioridade de **interesse imediato** na fila (3.4): Baixa → Alta/Média?
- [ ] Revisar prioridade de **histórico de contatos** e escopo social (3.3, 3.5)
- [ ] Corrigir **RNF01** (remover famílias do MVP ou marcar como futuro) (5.4)

### Validar escopo (❌ clínico / compartilhado)

- [ ] **Atendimento com múltiplos profissionais** (2.5)
- [ ] **Registro de intercorrências** (2.7) — MVP mínimo ou só pós-MVP?
- [ ] Perfil **Serviço Social** dedicado (3.7)

### Backlog pós-MVP (já reconhecido no REQUISITOS.md)

- [ ] Prontuário, anamnese, evolução, relatórios técnicos, PTI (2.1–2.4, 2.8)
- [ ] Relatórios por profissional e por fonte de recurso (4.1, 4.2)
- [ ] Exportação editável para convênios (4.4)
- [ ] Trilha de auditoria / histórico para fiscalização (4.5)
- [ ] Portal ou app para responsáveis (Quadro 16)

---

## 8. Próximos passos recomendados

1. **Reunião de validação** com a AMA Itajaí para fechar itens marcados ⚠️ e ❌.
2. **Atualizar REQUISITOS.md** após validação (novos RFs para grupo, reposição, intercorrências; ajuste de prioridades RF22/RF23; correção RNF01).
3. **Manter este TODO.md** como checklist de lacunas com a ONG; o status de implementação do código fica em `REQUISITOS.md` (seção 3.3).

---

*Gerado em maio/2026 com base em `REQUISITOS.md` e texto institucional fornecido pela AMA Itajaí.*
