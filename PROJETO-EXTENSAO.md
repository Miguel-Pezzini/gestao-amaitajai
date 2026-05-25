# Projeto de Extensão — Gestão AMA Itajaí

Documento derivado do relatório formal de extensão da UNIVALI. Contém apenas o contexto necessário para orientar o desenvolvimento do sistema.

**Documentos relacionados:** [`REQUISITOS.md`](REQUISITOS.md) (requisitos detalhados, casos de uso, MVP) · [`TODO.md`](TODO.md) (lacunas entre requisitos e demandas da ONG)

---

## Identificação

| Campo | Valor |
|---|---|
| **Título** | Desenvolvimento de Sistema Web para Gestão Institucional na AMA Itajaí |
| **Instituição** | Universidade do Vale do Itajaí — Escola Politécnica |
| **Curso / Disciplina** | Ciência da Computação — Programação Web |
| **Docente** | Jhonatan Alves |
| **Parceiro** | AMA Itajaí (Associação de Amigos do Autista de Itajaí) |
| **Carga horária** | 60 h |
| **Ano** | 2026 |

**Equipe:** Milca Leite Pereira Barreto · Miguel Pezzini Kuhr · Davi Barros Campos · Lucas Henrique de Melo Gubert

---

## Contexto da instituição

A AMA Itajaí é uma organização do terceiro setor, sem fins lucrativos, que atende crianças e adolescentes com Transtorno do Espectro Autista (TEA) e oferece suporte às famílias.

- Atende demandas via **convênios públicos** (municipal e estadual) e **particulares**
- Está sujeita a exigências de **controle e prestação de contas** sobre recursos públicos
- Muitos processos ainda são **manuais**, o que dificulta organização, confiabilidade dos dados e geração de relatórios
- O projeto nasce da vivência direta de uma integrante da equipe com a instituição

---

## Objetivo do projeto

Desenvolver um **sistema web** para apoiar a gestão interna da AMA Itajaí, organizando processos institucionais de forma mais eficiente, confiável e transparente.

**Objetivos específicos (macro):**

1. Levantar e compreender as necessidades da instituição
2. Planejar estrutura e funcionalidades compatíveis com a realidade da AMA
3. Desenvolver aplicação web focada em processos internos
4. Testar e validar o funcionamento
5. Documentar e propor expansões futuras

---

## Público-alvo

| Público | Descrição |
|---|---|
| **Direto** | Profissionais da AMA: equipe administrativa, recepção e colaboradores envolvidos na organização de atendimentos e informações |
| **Indireto** | Crianças/adolescentes atendidos e suas famílias, que dependem de um serviço organizado e eficiente |

Perfis de usuário do sistema (detalhados em `REQUISITOS.md`): Recepcionista/Administrativo, Profissional Terapêutico, Gestor Institucional (futuro).

---

## Escopo funcional (MVP)

O relatório de extensão define o sistema de forma flexível para expansões futuras. O **escopo técnico do MVP** está detalhado em `REQUISITOS.md`:

- Cadastro de pacientes (com fonte de custeio)
- Agenda visual (diária/semanal) por profissional
- Presença, faltas e justificativas + impressão de listas
- Check-in e painel de chegadas em tempo real
- Fila de espera com prioridade

**Fora do MVP (backlog):** prontuário, anamnese, plano terapêutico individual, relatórios financeiros, portal para responsáveis. Ver `REQUISITOS.md` e `TODO.md`.

---

## Stack e arquitetura

| Camada | Tecnologia |
|---|---|
| **Frontend** | React (JavaScript) |
| **Backend** | Express.js (JavaScript) |
| **Estilização** | Tailwind CSS |
| **Componentes** | shadcn/ui |
| **HTTP** | Axios |
| **Roteamento** | React Router |

**Decisões arquiteturais:**

- Arquitetura **cliente-servidor**
- Interface **responsiva** (desktop, tablet, celular)
- Acesso via **navegadores modernos**, sem instalação local
- Organização **modular** para manutenção e expansão
- **Autenticação** e **controle de acesso por perfil**
- **Validação de dados** no backend e frontend

---

## Metodologia de desenvolvimento

1. Levantamento de requisitos junto à instituição (análise documental + comunicação direta)
2. Planejamento de funcionalidades, páginas e dados
3. Desenvolvimento incremental com priorização do MVP
4. Testes e ajustes
5. Documentação e análise de melhorias futuras

**Alinhamento ODS:** ODS 3 (Saúde e Bem-Estar) · ODS 10 (Redução das Desigualdades)

---

## Parceiro e validação

| Organização | Papel |
|---|---|
| **AMA Itajaí** | Participação em reuniões de planejamento; validação da solução ao longo do desenvolvimento (reuniões e demonstrações) |

---

## Restrições e premissas

- Projeto acadêmico de extensão com **60 h** de carga horária — escopo deve ser viável nesse prazo
- **Sem orçamento** para infraestrutura ou licenças pagas
- Solução deve atender exigências de **prestação de contas** (presença, categorização por fonte de custeio)
- Dados sensíveis de menores com TEA — considerar **LGPD** e acesso restrito por perfil
- Modelo **híbrido** de presença (digital + assinatura física em papel) pode ser exigido por convênios — ver `TODO.md`

---

## Guia rápido para a IA

Ao implementar ou alterar o sistema, priorizar:

1. **`REQUISITOS.md`** — fonte de verdade para RFs, RNFs, casos de uso e delimitação de escopo
2. **`TODO.md`** — demandas da ONG ainda não cobertas ou parcialmente documentadas
3. **Stack acima** — não introduzir frameworks divergentes sem motivo
4. **MVP primeiro** — cadastro, agenda, presença, check-in, fila de espera
5. **Perfis de acesso** — recepção (escrita) vs. profissional (leitura/agenda) vs. gestor (futuro)
