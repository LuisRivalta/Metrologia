---
tags: [produto, prd]
---

# PRD: Metrologia PRO

**Versao:** 1.3  
**Data de referencia:** 28 de abril de 2026  
**Responsavel:** Time interno de Metrologia com apoio de Engenharia de Software

## 1. Visao geral

### Objetivo principal
Substituir o controle manual em planilhas por um sistema web auditavel, centralizado e orientado ao ciclo real de calibracao dos instrumentos.

### Problema que o produto resolve
- Controle descentralizado em planilhas e arquivos soltos
- Risco de perda de prazo de calibracao
- Dificuldade de rastrear certificados e historico tecnico
- Baixa padronizacao entre categorias
- Muito trabalho manual para ler e digitar certificados

### Solucao proposta
Uma plataforma web para o time de metrologia funcionar como fonte unica da verdade para:
- inventario tecnico
- categorias e templates de calibracao
- prazos e vencimentos
- historico de certificados
- apoio tecnico de revisao com IA

## 2. Usuarios e contexto
- Usuario principal: time interno de metrologia
- Contexto de uso: operacao interna, rastreabilidade, auditoria e manutencao do parque
- Prioridade: confiabilidade operacional acima de automacao cega

## 3. Escopo funcional atual

### 3.1 Autenticacao e acesso
- Login com `Supabase Auth`
- Protecao de paginas internas e endpoints operacionais

### 3.2 Dashboard
- Indicadores reais de instrumentos
- Alertas de itens perto do vencimento ou vencidos
- Distribuicao por status de prazo

### 3.3 Categorias
- CRUD de categorias
- Cada categoria define um template de calibracao
- O template suporta grupo e subgrupo
- Alteracoes no template podem ser sincronizadas para instrumentos vinculados

### 3.4 Medidas
- CRUD de unidades de medida
- Conversao entre representacao amigavel da UI e formato tecnico do banco

### 3.5 Instrumentos
- CRUD de instrumentos
- Vinculo obrigatorio com categoria
- Campo `fabricante` opcional
- Campo `setor` opcional (FK para `setores`)
- Detalhe individual com ultimo valor por campo

### 3.6 Cadastro de novo instrumento
- Fluxo recomendado em 2 etapas:
  - dados do instrumento
  - certificado e calibracao inicial
- A categoria define automaticamente o template inicial
- O usuario pode enviar o PDF ja no cadastro

### 3.7 Nova calibracao
- Tela dedicada para registrar nova calibracao de instrumento existente
- Upload obrigatorio do certificado em PDF
- Revisao manual dos dados antes de salvar

### 3.8 Log de calibracoes
- Historico por instrumento
- Filtro por periodo ou intervalo de datas
- Exibicao do nome do PDF como identificacao quando necessario
- Acesso ao certificado armazenado
- Exibicao dos valores registrados naquela calibracao

### 3.9 IA e automacao
- Extracao assistida por IA a partir do PDF
- Pre-preenchimento de datas, responsavel, observacoes e valores dos campos
- Sem aprovacao automatica
- Combinacao de parser local + modelo da OpenRouter

### 3.10 Regras derivadas
- Suporte a regras automaticas por categoria
- Ja implementado para `Paquimetro`

## 4. Requisitos funcionais

### RF-01
O sistema deve permitir cadastrar, editar e excluir categorias.

### RF-02
O sistema deve impedir a exclusao de categoria com instrumentos vinculados.

### RF-03
O sistema deve permitir cadastrar, editar e excluir unidades de medida.

### RF-04
O sistema deve permitir cadastrar, editar e excluir instrumentos.

### RF-05
O campo `fabricante` deve ser opcional.

### RF-06
Cada categoria deve possuir template reutilizavel de calibracao.

### RF-07
O cadastro de novo instrumento deve suportar fluxo em 2 etapas.

### RF-08
O sistema deve permitir registrar calibracao inicial no cadastro do instrumento.

### RF-09
O sistema deve permitir registrar novas calibracoes para instrumento existente.

### RF-10
O sistema deve aceitar upload de certificado em PDF.

### RF-11
O nome do PDF deve servir como identificacao padrao da calibracao quando necessario.

### RF-12
O sistema deve permitir extracao assistida por IA dos dados do certificado.

### RF-13
O usuario deve revisar manualmente os dados sugeridos pela IA antes de salvar.

### RF-14
O sistema deve suportar calculos automaticos por categoria.

### RF-15
O dashboard deve exibir indicadores reais de instrumentos, categorias e prazos.

## 5. Requisitos nao funcionais

### RNF-01
O sistema deve operar sobre dados reais do Supabase.

### RNF-02
O schema principal de negocio e `calibracao`.

### RNF-03
Fluxos sensiveis devem ter confirmacao explicita.

### RNF-04
A extracao por IA deve falhar de forma controlada, com timeout e mensagens claras.

### RNF-05
Regras de negocio criticas devem ser cobertas por testes automatizados.

### RNF-06
A documentacao deve refletir o estado real do codigo e do produto.

### RNF-07
O sistema deve preservar rastreabilidade de certificado e historico de calibracao.

## 6. Estado atual do produto

### Implementado
- login
- dashboard
- categorias
- medidas
- instrumentos
- detalhe de instrumento
- log de calibracoes
- nova calibracao
- cadastro de novo instrumento com calibracao inicial
- upload de PDF
- extracao assistida por IA
- parser local complementar para certificados conhecidos
- calculos automaticos para `Paquimetro`
- setores de uso dos instrumentos (CRUD em `/configuracoes/setores`, filtro e campo nos formularios)
- testes unitarios da camada de regra

### Em evolucao
- ampliar regras derivadas para outras categorias
- melhorar a qualidade e a velocidade da extracao por IA
- aumentar cobertura de regras ainda nao blindadas
- aproximar ainda mais os templates da estrutura real dos certificados e planilhas

## 7. Riscos e cuidados de produto
- A IA pode sugerir dados incompletos ou imprecisos; a revisao humana continua obrigatoria
- Mudancas de categoria ou template impactam o cadastro e a leitura de calibracoes futuras
- O valor juridico e operacional do historico depende de manter certificado e metadados consistentes

## 8. Roadmap sugerido

### Fase 1
- consolidar inventario, categorias, medidas e dashboard

### Fase 2
- consolidar historico de calibracoes, upload de PDF e revisao humana

### Fase 3
- ampliar automacoes por categoria
- melhorar indicadores operacionais
- evoluir apoio tecnico ao time de metrologia

## 9. Tecnologias
- `Next.js`
- `React`
- `TypeScript`
- `Supabase`
- `OpenRouter`
- `Vitest`
