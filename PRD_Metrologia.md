# PRD: Metrologia PRO

**Versao:** 1.1  
**Data de referencia:** 13 de abril de 2026  
**Responsavel:** Time interno de Metrologia e apoio de Engenharia de Software

---

## 1. Visao Geral

### Objetivo principal
Substituir o controle manual em planilhas por um sistema web auditavel, centralizado e orientado ao ciclo real de calibracao dos instrumentos.

### Problema atual
- Controle descentralizado em planilhas e arquivos espalhados.
- Alto risco de perda de prazo.
- Dificuldade de rastrear certificados e historico.
- Baixa padronizacao entre categorias de instrumentos.
- Trabalho manual excessivo na leitura e digitacao dos certificados.

### Solucao proposta
Uma plataforma web dedicada ao time de metrologia, funcionando como fonte unica da verdade para:
- inventario tecnico
- categorias e templates
- cronograma de calibracoes
- historico de certificados
- apoio a revisao tecnica

---

## 2. Escopo Funcional

### 2.1 Cadastro e Inventario
- Cadastro de categorias.
- Cadastro de unidades de medida.
- Cadastro de instrumentos.
- Detalhe individual por instrumento.

### 2.2 Templates por categoria
- Cada categoria define um template de calibracao.
- O instrumento herda esse template no momento do cadastro.
- O template representa os itens que devem aparecer na tabela de calibracao.
- Em categorias mais complexas, o template pode ter muitos itens e deve continuar legivel.

### 2.3 Fluxo de novo instrumento
- Etapa 1: dados do instrumento.
- Etapa 2: certificado e calibracao inicial.
- O usuario pode subir o PDF ja no cadastro do instrumento.
- A IA tenta pre-preencher a tabela.
- O usuario revisa e confirma antes de salvar.

### 2.4 Fluxo de nova calibracao
- Tela dedicada para registrar uma nova calibracao de instrumento ja existente.
- Upload de PDF.
- Pre-preenchimento assistido por IA.
- Revisao manual da tabela.
- Registro no log historico.

### 2.5 Log de calibracoes
- Lista historica por instrumento.
- Exibicao do nome do arquivo PDF como identificacao da calibracao.
- Acesso ao certificado vinculado.
- Exibicao dos valores registrados na calibracao.

### 2.6 IA e automacao
- A IA le o PDF e tenta extrair:
  - datas
  - responsavel
  - observacoes
  - valores dos itens do template
- A IA nao deve aprovar automaticamente a calibracao.
- Campos derivados devem ser calculados pelo sistema.

### 2.7 Calculos por categoria
- O sistema precisa suportar regras derivadas por categoria.
- Exemplo ja implementado:
  - categoria `Paquimetro`
  - soma automatica de campos como `Incerteza + maior Erro ...`

---

## 3. Requisitos Funcionais

### RF-01
O sistema deve permitir cadastrar, editar e excluir categorias.

### RF-02
O sistema deve impedir a exclusao de uma categoria se existirem instrumentos vinculados a ela.

### RF-03
O sistema deve permitir cadastrar, editar e excluir unidades de medida.

### RF-04
O sistema deve permitir cadastrar instrumentos vinculados a uma categoria.

### RF-05
O campo `fabricante` deve ser opcional.

### RF-06
Cada categoria deve possuir um template de calibracao reutilizavel.

### RF-07
O cadastro de instrumento deve acontecer em duas etapas.

### RF-08
O sistema deve permitir registrar uma calibracao inicial no cadastro do instrumento.

### RF-09
O sistema deve permitir registrar novas calibracoes para um instrumento existente.

### RF-10
O sistema deve permitir upload de certificado em PDF.

### RF-11
O nome do PDF deve ser usado como identificacao principal no log quando nao houver titulo manual.

### RF-12
O sistema deve permitir extracao assistida por IA dos dados do certificado.

### RF-13
O usuario deve revisar manualmente os dados sugeridos pela IA antes de salvar.

### RF-14
O sistema deve suportar calculos automaticos por categoria para campos derivados.

### RF-15
O dashboard deve exibir indicadores reais de instrumentos, categorias e prazos.

---

## 4. Requisitos Nao Funcionais

### RNF-01
O sistema deve operar sobre dados reais do Supabase no schema `calibracao`.

### RNF-02
A aplicacao deve ser responsiva e funcionar em desktop e mobile.

### RNF-03
Fluxos sensiveis devem ter confirmacao explicita.

### RNF-04
A extracao por IA deve ter timeout para nao prender a interface indefinidamente.

### RNF-05
Regras de negocio criticas devem ser cobertas por testes automatizados.

### RNF-06
A documentacao do projeto deve refletir o estado real do sistema.

---

## 5. Estado Atual do Produto

### Ja implementado
- categorias
- unidades de medida
- instrumentos
- dashboard
- detalhe individual de instrumento
- log de calibracoes
- cadastro de nova calibracao
- cadastro de novo instrumento em 2 etapas
- upload de PDF
- extracao assistida por IA via OpenRouter
- calculos automaticos para `Paquimetro`
- TDD com cobertura

### Ainda em evolucao
- ampliar regras derivadas para outras categorias
- melhorar a qualidade e a velocidade da extracao por IA
- tornar os templates mais proximos da estrutura real das planilhas por categoria
- ampliar cobertura de testes em regras ainda sem cobertura suficiente

---

## 6. Roadmap

### Fase 1
- inventario tecnico
- categorias e medidas
- dashboard
- detalhe de instrumento

### Fase 2
- cadastro de calibracao com upload de PDF
- log historico
- pre-preenchimento com IA
- revisao humana

### Fase 3
- ampliar regras automaticas por categoria
- melhorar dashboards e indicadores
- evoluir rastreabilidade e analise operacional

---

## 7. Tecnologias
- React
- Next.js
- TypeScript
- Supabase
- OpenRouter
- Vitest
