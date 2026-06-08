# Projeto de Extensão — Gestão AMA Itajaí

Documento derivado do relatório formal de extensão da UNIVALI. Contém o contexto acadêmico e institucional do projeto.

**Documentos relacionados:** [`TODO.md`](TODO.md) (o que está feito e pendente) · [`docs/`](docs/) (regras de negócio e modelagem técnica da agenda)

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

**Perfis no sistema (implementados):**

| Perfil | Papel |
|---|---|
| **Administrador** | Cadastro de pacientes, cadastros gerais, agenda completa, ocupação de salas |
| **Técnico** | Visualiza a própria agenda e marca sessões como realizadas |

Funcionalidades de gestão institucional (relatórios consolidados) e portal para famílias ficam no backlog — ver [`TODO.md`](TODO.md).

---

## Escopo funcional

O escopo evoluiu após validação com a ONG (maio/2026). A documentação técnica vive em [`docs/REGRAS-NEGOCIO-AGENDA.md`](docs/REGRAS-NEGOCIO-AGENDA.md) e [`docs/MODELAGEM-DADOS-AGENDA.md`](docs/MODELAGEM-DADOS-AGENDA.md).

### Já entregue no repositório

- Cadastro de pacientes com fonte de custeio
- Cadastros gerais (salas, modalidades, tipos de sessão, funcionários)
- Agenda com sessões individuais, em dupla e em grupo
- Controle de conflitos e cancelamento de sessões
- Ocupação de salas

### Próximos módulos do MVP

- Presença e listas para impressão
- Check-in e painel de chegadas
- Fila de espera com prioridade

### Fora do escopo atual

Prontuário, anamnese, plano terapêutico individual, relatórios financeiros, portal para responsáveis, login Google e assinatura digital. Detalhes em [`TODO.md`](TODO.md).

---

## Stack e arquitetura

| Camada | Tecnologia |
|---|---|
| **Frontend** | React (JavaScript), Vite, Tailwind CSS, shadcn/ui, React Router, Axios |
| **Backend** | Express.js (TypeScript), Prisma |
| **Banco de dados** | PostgreSQL |
| **Dev local (DB)** | Docker Compose (`backend/docker-compose.yml`) |

**Decisões arquiteturais:**

- Arquitetura **cliente-servidor** (monorepo com `frontend/` e `backend/`)
- Persistência relacional em **PostgreSQL** via Prisma
- Interface **responsiva** (desktop, tablet, celular)
- Acesso via **navegadores modernos**, sem instalação local
- Organização **modular** por domínio (rotas, services, validators no backend; features e pages no frontend)
- **Autenticação** por sessão (cookie httpOnly) e **controle de acesso por perfil**
- **Validação de dados** no backend (validators) e feedback no frontend

> O documento acadêmico inicial citava MongoDB; o projeto migrou para PostgreSQL para melhor modelagem de agenda, relacionamentos e integridade referencial.

---

## Metodologia de desenvolvimento

1. Levantamento de requisitos junto à instituição (análise documental + comunicação direta)
2. Planejamento de funcionalidades, páginas e dados
3. Desenvolvimento incremental com priorização do MVP
4. Testes e ajustes (integração no backend com Vitest)
5. Documentação viva em `docs/` e registro de features em `docs/features/`

**Alinhamento ODS:** ODS 3 (Saúde e Bem-Estar) · ODS 10 (Redução das Desigualdades)

---

## Parceiro e validação

| Organização | Papel |
|---|---|
| **AMA Itajaí** | Participação em reuniões de planejamento; validação da solução ao longo do desenvolvimento (reuniões e demonstrações) |

**Última validação registrada:** 27/05/2026 — perfis administrador/técnico, modalidades com limites, cadastro manual, cadastros gerais por administrador; login Google e assinatura digital postergados.

---

## Restrições e premissas

- Projeto acadêmico de extensão com **60 h** de carga horária — escopo deve ser viável nesse prazo
- **Sem orçamento** para infraestrutura ou licenças pagas
- Solução deve atender exigências de **prestação de contas** (presença, categorização por fonte de custeio)
- Dados sensíveis de menores com TEA — considerar **LGPD** e acesso restrito por perfil
- Modelo **híbrido** de presença (digital + assinatura física em papel) pode ser exigido por convênios — ver [`TODO.md`](TODO.md)

---

## Guia rápido para quem vai contribuir

1. **Comece pelo [`README.md`](README.md)** — setup local e mapa do repositório
2. **`TODO.md`** — status do que já existe e próximas entregas
3. **`docs/`** — regras de negócio antes de alterar agenda ou cadastros
4. **`AGENTS.md`** — ciclo TDD e comandos de validação para agentes de IA
5. **MVP em seguida** — presença, check-in, fila de espera (rotas já preparadas no frontend, ainda desabilitadas no menu)
