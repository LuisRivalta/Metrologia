# PRD: Projeto Metrologia – Gestão de Conformidade e Calibração

**Versão:** 1.0  
**Data:** 28 de Março de 2026  
**Responsável:** Equipe de Metrologia e Engenharia de Software  

---

## 1. Visão Geral e Objetivos

**Objetivo Principal:** Transição definitiva da gestão manual via planilhas para um sistema web auditável, centralizado e com garantia absoluta de integridade de dados.

**O Problema Atual:** Atualmente, a rastreabilidade dos instrumentos de medição da empresa depende de controles descentralizados (arquivos Excel). Isso gera um alto risco de perda de prazos de calibração, inconsistência de dados por erros de digitação humana e grave vulnerabilidade em auditorias normativas.

**A Solução Proposta:** Desenvolvimento de uma plataforma web robusta e dedicada exclusivamente ao time de metrologia. O sistema atuará como a "fonte única da verdade" (*Single Source of Truth*) para o controle do inventário físico, cronograma de calibrações e repositório centralizado de certificados.

---

## 2. Requisitos Funcionais e Arquitetura do Sistema

Com base no fluxo operacional aprovado, o sistema contará com os seguintes módulos críticos:

* **Inventário Técnico Estruturado:** Cadastro detalhado e dinâmico (separado por Categorias de ativos). O sistema exigirá o preenchimento de TAG, Fabricante, Faixa de Medição, Resolução e Critério de Aceitação antes de gravar no banco de dados.
* **Cronograma Inteligente (Gestão de Prazos):** Módulo de notificações proativas. Disparo de alertas automáticos (30, 15 e 7 dias) antes do vencimento da calibração de qualquer instrumento cadastrado.
* **Upload Automático de Certificados (Motor IA):** Diferencial tecnológico do projeto. O sistema utilizará IA/OCR para interpretar os PDFs de calibração enviados e extrair automaticamente as informações pertinentes.
* **Validação de Conformidade (ISO 9001):** Os dados lidos pela IA passarão obrigatoriamente por uma etapa de "Verificação Humana" do metrologista antes de serem efetivados, garantindo o rigor técnico exigido pelas normas de qualidade.
* **Gestão e Consulta de Certificados:** Vinculação automática dos PDFs aprovados à "Ficha" de cada instrumento, permitindo consulta instantânea do histórico completo sem a necessidade de buscar em pastas de rede.
* **Log de Auditoria (Audit Trail):** Criação de um registro rastreável e **imutável** para a segurança do banco de dados. O sistema gravará silenciosamente *Quem* alterou um dado, *Quando* isso ocorreu e *O Quê* foi modificado (Valor Antigo -> Valor Novo).

---

## 3. Roadmap e Próximos Passos (Faseamento)

Para garantir uma entrega de valor contínua e mitigar riscos de desenvolvimento, o projeto será executado em três fases:

* **Fase 1 (O Alicerce):** Cadastro de Inventário (Instrumentos e Categorias) e motor de Alertas de Vencimento.
* **Fase 2 (Automação):** Módulo de Upload Inteligente de Certificados (IA + Validação Humana) e emissão de Relatórios base para Auditoria.
* **Fase 3 (Inteligência Preditiva):** Dashboards de Tendência e análise estatística da estabilidade dos instrumentos ao longo do tempo.

## 4. Tecnologias 

* **React js
* **Next js
* **html
* **supabase
* **typescript