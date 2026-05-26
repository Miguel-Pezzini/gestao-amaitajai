# Análise de Requisitos do Sistema Web

**Desenvolvimento de Sistema Web para Gestão Institucional na AMA Itajaí**

---

| | |
|---|---|
| **Instituição** | Universidade do Vale do Itajaí — Escola Politécnica |
| **Curso** | Ciência da Computação |
| **Disciplina** | Programação Web |
| **Professor** | Jhonatan Alves |
| **Local / Ano** | Itajaí, 2026 |

**Equipe:**

- Milca Leite Pereira Barreto
- Miguel Pezzini Kuhr
- Davi Barros Campos
- Lucas Henrique de Melo Gubert

---

## Sumário

1. [Introdução](#1-introdução)
   - 1.1 [Contextualização](#11-contextualização)
   - 1.2 [Objetivo](#12-objetivo)
   - 1.3 [Escopo do Projeto (MVP)](#13-escopo-do-projeto-mvp)
2. [Metodologia de Levantamento de Requisitos](#2-metodologia-de-levantamento-de-requisitos)
   - 2.1 [Técnicas Utilizadas](#21-técnicas-utilizadas)
   - 2.2 [Perfis de Usuários Identificados](#22-perfis-de-usuários-identificados)
   - 2.3 [Pesquisa de Referências e Análise de Mercado](#23-pesquisa-de-referências-e-análise-de-mercado)
3. [Requisitos do Sistema](#3-requisitos-do-sistema)
   - 3.1 [Requisitos Funcionais](#31-requisitos-funcionais)
   - 3.2 [Requisitos Não Funcionais](#32-requisitos-não-funcionais)
   - 3.3 [Status de Implementação](#33-status-de-implementação)
4. [Casos de Uso](#4-casos-de-uso)
5. [Delimitação do Escopo](#5-delimitação-do-escopo)
6. [Considerações Finais](#6-considerações-finais)
7. [Referências](#referências)

---

## 1. Introdução

### 1.1 Contextualização

A AMA Itajaí (Associação de Amigos do Autista de Itajaí) é uma organização do terceiro setor, sem fins lucrativos, que presta atendimento especializado a crianças e adolescentes com Transtorno do Espectro Autista (TEA) e oferece suporte contínuo às suas famílias. Por se tratar de uma Organização da Sociedade Civil (OSC), a instituição está sujeita a exigências rigorosas de controle e prestação de contas relacionadas ao uso de recursos públicos provenientes de convênios com o município e com o Estado.

Atualmente, diversos processos administrativos, clínicos e sociais da AMA Itajaí ainda são realizados de forma manual, o que gera retrabalho, risco de inconsistências nos dados e dificuldades na produção de relatórios gerenciais. Esse cenário motivou a proposta de desenvolvimento de um sistema web integrado, capaz de modernizar as rotinas internas e garantir maior confiabilidade nos registros institucionais.

### 1.2 Objetivo

Este documento tem por objetivo apresentar o levantamento e a análise de requisitos do sistema web a ser desenvolvido para a AMA Itajaí, como parte do projeto de extensão vinculado à disciplina de Programação Web. O levantamento foi conduzido a partir de análise documental e comunicação direta com a instituição parceira, seguindo técnicas da Engenharia de Requisitos.

### 1.3 Escopo do Projeto (MVP)

Considerando o nível técnico da equipe e o tempo disponível para o desenvolvimento, optou-se pela construção de um **Produto Mínimo Viável (MVP)** — conceito da Engenharia de Software que designa uma versão inicial do sistema com as funcionalidades essenciais — focado no módulo de **Cadastro e Agenda**. As funcionalidades priorizadas são:

a) Cadastro de pacientes com categorização por fonte de custeio — **implementado**;

b) Agenda visual de atendimentos por profissional (diária e semanal) — *pendente*;

c) Registro e controle de presença e faltas com justificativas — *pendente*;

d) Geração de lista de presença formatada para impressão — *pendente*;

e) Painel de check-in com visualização de chegadas em tempo real — *pendente*;

f) Gerenciamento de fila de espera com nível de prioridade — *pendente*.

As demais funcionalidades identificadas junto à ONG — prontuário eletrônico, plano terapêutico individual e relatórios financeiros — estão documentadas como **fora do escopo** desta etapa, podendo ser desenvolvidas em versões futuras do sistema.

---

## 2. Metodologia de Levantamento de Requisitos

### 2.1 Técnicas Utilizadas

O levantamento de requisitos foi conduzido por meio da combinação de técnicas consagradas da Engenharia de Requisitos, conforme descrito no Quadro 1.

**Quadro 1 – Técnicas de levantamento de requisitos utilizadas**

| Técnica | Descrição da Aplicação |
|---|---|
| Análise Documental | Leitura e análise do documento institucional fornecido pela AMA Itajaí, contendo a descrição detalhada das necessidades, organizadas por eixos temáticos. |
| Comunicação Direta | Contato com profissional da AMA Itajaí para esclarecimento de dúvidas e validação das prioridades identificadas. |
| Brainstorming | Reunião interna da equipe para discutir as demandas, identificar funcionalidades prioritárias e definir o escopo viável do MVP. |
| Pesquisa de Referências | Análise de sistemas similares de gestão de clínicas e ONGs para embasar decisões de design e funcionalidades. |

*Fonte: elaborado pelos autores (2026).*

### 2.2 Perfis de Usuários Identificados

Com base no levantamento realizado, foram identificados os seguintes perfis de usuários do sistema, conforme Quadro 2.

**Quadro 2 – Perfis de usuários do sistema**

| Perfil | Responsabilidades no Sistema |
|---|---|
| Recepcionista / Administrativo | Responsável pelo cadastro de pacientes, gerenciamento da agenda, controle de presença, check-in e gestão da fila de espera. É o perfil com maior interação com o sistema. |
| Profissional Terapêutico | Consulta a agenda do dia e acompanha o status de chegada dos pacientes. Acesso de leitura ao painel de check-in. |
| Gestor Institucional | Acessa relatórios consolidados para fins de gestão e prestação de contas. Funcionalidade prevista para versões futuras do sistema. |

*Fonte: elaborado pelos autores (2026).*

### 2.3 Pesquisa de Referências e Análise de Mercado

Com o objetivo de embasar as decisões de design e funcionalidades do sistema, foi realizada uma pesquisa de referências que analisou sistemas similares de gestão de clínicas, ONGs e instituições terapêuticas. Essa etapa se fundamenta na técnica de benchmarking, amplamente utilizada na Engenharia de Requisitos para identificar boas práticas e lacunas não atendidas pelo mercado (PRESSMAN; MAXIM, 2016).

#### 2.3.1 Análise de Sistemas Concorrentes

Foram analisados os principais sistemas disponíveis no mercado que poderiam, em tese, atender às necessidades da AMA Itajaí. O Quadro 3 apresenta um comparativo das soluções identificadas e suas limitações para o contexto específico da instituição.

**Quadro 3 – Análise comparativa de sistemas de referência**

| Sistema | Tipo / Segmento | Funcionalidades Relevantes | Limitação para o Contexto da AMA |
|---|---|---|---|
| Ninsaúde Apolo | Clínicas e consultórios | Agenda, prontuário, faturamento, relatórios | Pago e focado em saúde privada; não contempla gestão de OSC/convênio público |
| iClinic | Clínicas médicas e terapêuticas | Agenda online, prontuário eletrônico, telemedicina | Sem suporte à prestação de contas para órgãos públicos; custo elevado para ONG |
| Projetos Sociais (SICONV) | ONGs e OSCs com convênios federais | Prestação de contas, controle de recursos públicos | Foco financeiro; sem gestão de atendimentos clínicos ou agenda terapêutica |
| Google Agenda + Planilhas | Uso informal em pequenas ONGs | Agendamento, controle manual de presença | Sem integração; propenso a erros; sem controle de acesso por perfil |
| TheraCorp / Astutis | Clínicas de ABA (autismo) | Plano terapêutico, evolução comportamental | Voltado ao exterior; idioma e conformidade legal distintos da realidade brasileira |

*Fonte: elaborado pelos autores com base em pesquisa de mercado (2026).*

A análise evidencia que nenhum dos sistemas disponíveis atende de forma integrada às necessidades específicas da AMA Itajaí: controle de presença para prestação de contas com órgãos públicos, gestão de fila de espera com priorização clínica e diferenciação por fonte de custeio (municipal, estadual ou particular). Esse gap de mercado justifica o desenvolvimento de uma solução própria e customizada.

#### 2.3.2 Tendências e Necessidades do Mercado de ONGs

A pesquisa também identificou as principais tendências no mercado de sistemas para organizações do terceiro setor e clínicas especializadas em saúde mental e desenvolvimento infantil, conforme Quadro 4.

**Quadro 4 – Tendências e necessidades do mercado para ONGs de saúde**

| Tendência / Necessidade | Relevância para a AMA Itajaí |
|---|---|
| Digitalização de prontuários e registros | A eliminação de registros em papel reduz erros, acelera o acesso à informação e facilita auditorias de órgãos públicos. |
| Controle de presença eletrônico | A geração automática de listas de presença é exigência dos convênios municipais e estaduais, sendo item prioritário para a AMA. |
| Sistemas acessíveis via web (SaaS) | Elimina a necessidade de infraestrutura local; facilita o acesso remoto e reduz custos de manutenção para a ONG. |
| Gestão de fila de espera com priorização | ONGs de saúde lidam com demanda reprimida. A fila digital com critérios de prioridade aumenta a equidade no acesso ao serviço. |
| Controle de acesso por perfil de usuário | Garante a segurança e a privacidade dos dados dos pacientes, conforme exigência da LGPD (Lei nº 13.709/2018). |
| Conformidade com a LGPD | Dados sensíveis de crianças com TEA exigem tratamento adequado, com acesso restrito e consentimento documentado. |

*Fonte: elaborado pelos autores com base em pesquisa documental e análise de mercado (2026).*

Com base nessa análise, conclui-se que o sistema a ser desenvolvido está alinhado às tendências atuais do setor e supre uma lacuna real: a ausência de uma solução digital acessível, de baixo custo e aderente às exigências de prestação de contas do setor público, voltada especificamente para ONGs de atendimento ao TEA.

---

## 3. Requisitos do Sistema

Os requisitos do sistema descrevem as funcionalidades e restrições que o produto deve atender. São classificados em **requisitos funcionais** — que especificam comportamentos e funcionalidades — e **requisitos não funcionais** — que estabelecem critérios de qualidade, desempenho e restrições técnicas (SOMMERVILLE, 2019).

**Legenda — status de implementação** *(atualizado conforme o código em maio/2026)*

| Status | Significado |
|---|---|
| Implementado | Desenvolvido e disponível no sistema (frontend e/ou backend) |
| Parcial | Base iniciada; funcionalidade ainda incompleta |
| Pendente | Previsto no MVP; ainda não desenvolvido |
| Futuro | Fora do escopo do MVP nesta etapa |

### 3.1 Requisitos Funcionais

Os requisitos funcionais estão organizados por módulo e classificados por prioridade:

- **Alta** — indispensável para o MVP
- **Média** — desejável
- **Baixa** — pode ser postergado

#### 3.1.1 Módulo de Cadastro de Pacientes: Milca

**Quadro 5 – Requisitos funcionais: Módulo Cadastro de Pacientes**

| ID | Descrição do Requisito | Prioridade | Módulo | Status |
|---|---|---|---|---|
| RF01 | O sistema deve permitir o cadastro de novos pacientes com os campos: nome completo, data de nascimento, responsável, telefone de contato e fonte de custeio (Municipal, Estadual ou Particular). | Alta | Cadastro | Implementado |
| RF02 | O sistema deve permitir a edição dos dados de um paciente já cadastrado. | Alta | Cadastro | Implementado |
| RF03 | O sistema deve permitir a inativação (exclusão lógica) de cadastro, sem apagar o histórico de atendimentos. | Média | Cadastro | Implementado |
| RF04 | O sistema deve permitir a busca de pacientes por nome ou nome do responsável. | Alta | Cadastro | Implementado |
| RF05 | O sistema deve exibir a listagem de pacientes com filtro por fonte de custeio. | Média | Cadastro | Implementado |

*Fonte: elaborado pelos autores com base em informações da AMA Itajaí (2026).*

#### 3.1.2 Módulo de Agenda

**Quadro 6 – Requisitos funcionais: Módulo Agenda**

| ID | Descrição do Requisito | Prioridade | Módulo | Status |
|---|---|---|---|---|
| RF06 | O sistema deve exibir agenda visual organizada por dia e semana, com visualização de horários, profissional e tipo de atendimento. | Alta | Agenda | Pendente |
| RF07 | O sistema deve permitir o agendamento de atendimentos individuais vinculando paciente e profissional. | Alta | Agenda | Pendente |
| RF08 | O sistema deve permitir a filtragem da agenda por profissional. | Alta | Agenda | Pendente |
| RF09 | O sistema deve exibir a fonte de custeio do paciente na visualização da agenda. | Média | Agenda | Pendente |
| RF10 | O sistema deve permitir o cancelamento de agendamento com registro de motivo. | Média | Agenda | Pendente |

*Fonte: elaborado pelos autores com base em informações da AMA Itajaí (2026).*

#### 3.1.3 Módulo de Presença

**Quadro 7 – Requisitos funcionais: Módulo de Presença**

| ID | Descrição do Requisito | Prioridade | Módulo | Status |
|---|---|---|---|---|
| RF11 | O sistema deve gerar automaticamente a lista de presença diária com base nos atendimentos agendados. | Alta | Presença | Pendente |
| RF12 | O sistema deve permitir o registro da situação de cada atendimento: Presente, Falta ou Falta Justificada. | Alta | Presença | Pendente |
| RF13 | O sistema deve permitir inserir justificativa textual para faltas justificadas. | Alta | Presença | Pendente |
| RF14 | O sistema deve gerar lista de presença formatada e pronta para impressão (página de impressão ou PDF). | Alta | Presença | Pendente |
| RF15 | O sistema deve gerar listas de presença semanais consolidadas por profissional. | Média | Presença | Pendente |

*Fonte: elaborado pelos autores com base em informações da AMA Itajaí (2026).*

#### 3.1.4 Módulo de Check-in

**Quadro 8 – Requisitos funcionais: Módulo de Check-in**

| ID | Descrição do Requisito | Prioridade | Módulo | Status |
|---|---|---|---|---|
| RF16 | O sistema deve permitir o registro de chegada (check-in) do paciente pela recepção. | Alta | Check-in | Pendente |
| RF17 | O sistema deve exibir painel em tempo real com o status dos pacientes: aguardando chegada, chegou ou ausente. | Alta | Check-in | Pendente |
| RF18 | O status de chegada do paciente deve ser visível pelo profissional terapêutico em sua agenda. | Média | Check-in | Pendente |

*Fonte: elaborado pelos autores com base em informações da AMA Itajaí (2026).*

#### 3.1.5 Módulo de Fila de Espera

**Quadro 9 – Requisitos funcionais: Módulo de Fila de Espera**

| ID | Descrição do Requisito | Prioridade | Módulo | Status |
|---|---|---|---|---|
| RF19 | O sistema deve permitir o cadastro de pessoas na fila de espera, vinculado ao cadastro de paciente existente ou como pré-cadastro. | Alta | Fila | Pendente |
| RF20 | O sistema deve permitir atribuir nível de prioridade a cada entrada da fila (Alta, Média ou Baixa). | Alta | Fila | Pendente |
| RF21 | O sistema deve exibir a fila de espera ordenada por prioridade e data de inclusão. | Alta | Fila | Pendente |
| RF22 | O sistema deve registrar histórico de tentativas de contato com a família, informando data, horário e responsável. | Média | Fila | Pendente |
| RF23 | O sistema deve permitir registrar se a família demonstrou interesse imediato em ingressar no serviço. | Baixa | Fila | Pendente |

*Fonte: elaborado pelos autores com base em informações da AMA Itajaí (2026).*

### 3.2 Requisitos Não Funcionais

Os requisitos não funcionais estabelecem critérios de qualidade e restrições técnicas que o sistema deve atender, independentemente das funcionalidades específicas.

**Quadro 10 – Requisitos não funcionais**

| ID | Atributo de Qualidade | Descrição | Status |
|---|---|---|---|
| RNF01 | Acessibilidade online | O sistema deve ser acessível via navegador web, sem necessidade de instalação, possibilitando acesso remoto por profissionais e famílias. | Parcial — app web para uso interno; portal para famílias fora do MVP |
| RNF02 | Usabilidade | A interface deve ser intuitiva e de fácil aprendizado, considerando que os usuários podem ter pouca familiaridade com sistemas digitais. | Parcial — interface base implementada; validação com usuários pendente |
| RNF03 | Responsividade | O sistema deve funcionar corretamente em diferentes tamanhos de tela (desktop, tablet e celular). | Parcial — layout responsivo (Tailwind); módulos do MVP ainda incompletos |
| RNF04 | Segurança e privacidade | O acesso ao sistema deve ser protegido por autenticação (login e senha). Os dados de pacientes devem ser restritos por perfil de usuário. | Implementado — login, logout e sessão JWT; rotas de pacientes autenticadas |
| RNF05 | Controle de acesso por perfil | O sistema deve distinguir permissões entre os perfis: Administrativo/Recepção e Profissional Terapêutico. | Parcial — navegação por perfil no frontend; campo `role` no usuário ainda pendente no backend |
| RNF06 | Impressão | As listas de presença geradas devem ser formatadas adequadamente para impressão em papel A4, conforme exigência dos órgãos conveniados. | Pendente |
| RNF07 | Disponibilidade | O sistema deve estar disponível durante o horário de funcionamento da instituição, com mínima indisponibilidade planejada. | Pendente — depende de infraestrutura e hospedagem |

*Fonte: elaborado pelos autores com base em informações da AMA Itajaí (2026).*

### 3.3 Status de Implementação

Consolidação do progresso de desenvolvimento em maio/2026, com base no repositório do projeto (`frontend/` e `backend/`).

**Quadro 11 – Resumo do status de implementação por módulo**

| Módulo / artefato | Requisitos | Status geral |
|---|---|---|
| Cadastro de pacientes | RF01–RF05 | Implementado |
| Agenda | RF06–RF10 | Pendente (rota e placeholder no sistema) |
| Presença | RF11–RF15 | Pendente (rota e placeholder no sistema) |
| Check-in | RF16–RF18 | Pendente (rota e placeholder no sistema) |
| Fila de espera | RF19–RF23 | Pendente (rota e placeholder no sistema) |
| Infraestrutura transversal | RNF01–RNF07 | Parcial (autenticação e shell do sistema) |
| Funcionalidades futuras | Quadro 16 | Futuro |

**Infraestrutura já disponível:** autenticação (login/logout/sessão), layout com menu lateral, visão geral e configuração modular das rotas do MVP.

*Fonte: elaborado pelos autores com base no código do projeto (2026).*

---

## 4. Casos de Uso

Os casos de uso descrevem as interações entre os usuários e o sistema, detalhando os fluxos de ação esperados. São apresentados a seguir os cinco casos de uso principais do MVP.

### UC01 – Cadastrar Paciente

| Campo | Descrição |
|---|---|
| **Identificador** | UC01 |
| **Nome do Caso de Uso** | Cadastrar Paciente |
| **Ator Principal** | Recepcionista |
| **Descrição** | A recepcionista registra os dados de um novo paciente no sistema. |
| **Pré-condição** | Usuário autenticado com perfil Administrativo. |
| **Fluxo Principal** | 1. Acessar menu 'Pacientes'; 2. Clicar em 'Novo Paciente'; 3. Preencher nome, data de nascimento, responsável, telefone e fonte de custeio; 4. Confirmar e salvar cadastro. |
| **Fluxo Alternativo** | Paciente já cadastrado: o sistema emite alerta e oferece a opção de abrir o cadastro existente. |
| **Pós-condição** | Novo paciente cadastrado com sucesso e disponível para agendamento. |
| **Status de implementação** | Implementado |

*Fonte: elaborado pelos autores (2026).*

### UC02 – Agendar Atendimento

| Campo | Descrição |
|---|---|
| **Identificador** | UC02 |
| **Nome do Caso de Uso** | Agendar Atendimento |
| **Ator Principal** | Recepcionista |
| **Descrição** | A recepcionista agenda um atendimento para um paciente com um profissional específico. |
| **Pré-condição** | Paciente e profissional cadastrados no sistema. |
| **Fluxo Principal** | 1. Acessar a Agenda; 2. Selecionar data e horário disponível; 3. Vincular paciente e profissional; 4. Confirmar agendamento. |
| **Fluxo Alternativo** | Conflito de horário: o sistema alerta sobre sobreposição e impede a confirmação. |
| **Pós-condição** | Atendimento agendado e visível na agenda do profissional. |
| **Status de implementação** | Pendente |

*Fonte: elaborado pelos autores (2026).*

### UC03 – Registrar Presença

| Campo | Descrição |
|---|---|
| **Identificador** | UC03 |
| **Nome do Caso de Uso** | Registrar Presença |
| **Ator Principal** | Recepcionista |
| **Descrição** | A recepcionista registra a presença ou falta dos pacientes ao final do dia. |
| **Pré-condição** | Atendimentos agendados para o dia. |
| **Fluxo Principal** | 1. Acessar a lista de presença do dia; 2. Para cada paciente, selecionar: Presente, Falta ou Falta Justificada; 3. Inserir justificativa, se aplicável; 4. Salvar registros. |
| **Fluxo Alternativo** | Lista não preenchida até o encerramento do dia: o sistema pode emitir notificação ao responsável. |
| **Pós-condição** | Registros de presença salvos e disponíveis para geração de relatórios. |
| **Status de implementação** | Pendente |

*Fonte: elaborado pelos autores (2026).*

### UC04 – Realizar Check-in

| Campo | Descrição |
|---|---|
| **Identificador** | UC04 |
| **Nome do Caso de Uso** | Realizar Check-in |
| **Ator Principal** | Recepcionista |
| **Descrição** | A recepcionista registra a chegada de um paciente na instituição. |
| **Pré-condição** | Paciente com atendimento agendado para o dia. |
| **Fluxo Principal** | 1. Acessar painel de check-in; 2. Localizar o nome do paciente; 3. Clicar em 'Registrar Chegada'; 4. Status atualizado no painel em tempo real. |
| **Fluxo Alternativo** | Paciente sem agendamento no dia: o sistema emite alerta à recepcionista. |
| **Pós-condição** | Status do paciente atualizado para 'Chegou' no painel e na agenda do profissional. |
| **Status de implementação** | Pendente |

*Fonte: elaborado pelos autores (2026).*

### UC05 – Gerar Lista de Presença para Impressão

| Campo | Descrição |
|---|---|
| **Identificador** | UC05 |
| **Nome do Caso de Uso** | Gerar Lista de Presença para Impressão |
| **Ator Principal** | Recepcionista |
| **Descrição** | A recepcionista gera e imprime a lista de presença para coleta de assinaturas dos responsáveis. |
| **Pré-condição** | Atendimentos agendados para o dia ou período selecionado. |
| **Fluxo Principal** | 1. Acessar módulo de Presença; 2. Selecionar data ou período; 3. Clicar em 'Gerar Lista para Impressão'; 4. O sistema exibe a lista formatada em A4; 5. Usuário aciona a impressão. |
| **Fluxo Alternativo** | Nenhum atendimento no período selecionado: o sistema exibe mensagem informativa. |
| **Pós-condição** | Lista impressa disponível para coleta de assinaturas físicas dos responsáveis. |
| **Status de implementação** | Pendente |

*Fonte: elaborado pelos autores (2026).*

---

## 5. Delimitação do Escopo

As funcionalidades listadas no Quadro 16 foram identificadas durante o levantamento de requisitos e são reconhecidas como relevantes pela AMA Itajaí. No entanto, estão **fora do escopo do MVP** desenvolvido nesta disciplina, podendo ser contempladas em versões futuras do sistema.

**Quadro 16 – Funcionalidades fora do escopo do MVP**

| Funcionalidade | Descrição | Status |
|---|---|---|
| Prontuário eletrônico | Histórico completo de atendimentos por paciente com registro sistematizado de evoluções clínicas. | Futuro |
| Anamnese | Cadastro e armazenamento do histórico clínico e familiar de cada paciente. | Futuro |
| Relatórios técnicos clínicos | Elaboração e armazenamento digital de relatórios terapêuticos individuais. | Futuro |
| Plano Terapêutico Individual | Acompanhamento de metas e evolução clínica por paciente. | Futuro |
| Relatórios financeiros | Relatórios por fonte de recurso (municipal, estadual, particular) para prestação de contas. | Futuro |
| Exportação para órgãos públicos | Geração de relatórios em formatos exigidos pelos convênios municipais e estaduais. | Futuro |
| Portal para responsáveis | Acesso externo para famílias acompanharem informações sobre o atendimento. | Futuro |

*Fonte: elaborado pelos autores com base em informações da AMA Itajaí (2026).*

---

## 6. Considerações Finais

A análise de requisitos apresentada neste documento consolidou as demandas identificadas junto à AMA Itajaí e definiu o escopo viável para o desenvolvimento do MVP no contexto da disciplina de Programação Web. O levantamento revelou um cenário de modernização urgente, em que a ausência de ferramentas digitais impacta diretamente a eficiência administrativa e a capacidade de prestação de contas da instituição.

A pesquisa de referências e a análise de mercado evidenciaram que nenhuma solução comercial disponível atende de forma integrada e acessível às necessidades específicas de uma ONG de atendimento ao TEA com convênios públicos. Esse cenário reforça a pertinência do projeto e a oportunidade de contribuição social que ele representa.

Os requisitos funcionais e não funcionais mapeados, os perfis de usuários identificados, os casos de uso descritos e a análise de mercado realizada constituem a base técnica para as etapas seguintes do projeto, que incluem a prototipagem das telas, o desenvolvimento da aplicação e os testes de validação. A parceria com a AMA Itajaí assegura que o sistema seja desenvolvido em conformidade com as necessidades reais da instituição, conferindo impacto social concreto ao projeto de extensão.

---

## Referências

ASSOCIAÇÃO DE PAIS E AMIGOS DO AUTISTA DE ITAJAÍ (AMA Itajaí). Informações institucionais e levantamento de necessidades fornecidos para elaboração do projeto. Itajaí, 2026.

BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). Brasília, DF: Presidência da República, 2018. Disponível em: https://www.planalto.gov.br. Acesso em: 20 abr. 2026.

BRASIL. Ministério da Saúde. Transtorno do Espectro Autista (TEA): informações gerais. Disponível em: https://www.gov.br/saude. Acesso em: 20 abr. 2026.

ORGANIZAÇÃO DAS NAÇÕES UNIDAS (ONU). Objetivos de Desenvolvimento Sustentável. Disponível em: https://brasil.un.org. Acesso em: 20 abr. 2026.

PRESSMAN, Roger S.; MAXIM, Bruce R. *Engenharia de Software: uma abordagem profissional*. 8. ed. Porto Alegre: AMGH, 2016.

SOMMERVILLE, Ian. *Engenharia de Software*. 10. ed. São Paulo: Pearson, 2019.
