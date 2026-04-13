# Contexto do Projeto

## Nome
- Metrologia PRO

## Descricao curta
- Plataforma web para cadastro de instrumentos, templates por categoria, controle de prazos de calibracao, historico de certificados e apoio operacional ao time de metrologia.

## Objetivo
- Centralizar informacoes tecnicas antes dispersas em planilhas e controles manuais.
- Dar rastreabilidade ao ciclo de calibracao.
- Reduzir risco de vencimento sem acompanhamento.
- Facilitar revisao tecnica, historico e preparacao para auditorias.

## Decisoes de produto vigentes
- Categoria define o template de calibracao.
- Instrumento herda esse template no cadastro.
- O cadastro de novo instrumento acontece em 2 etapas:
  - dados do instrumento
  - certificado e calibracao inicial
- O cadastro de nova calibracao de um instrumento existente usa tela propria.
- O nome do PDF identifica a calibracao no log.
- `Fabricante` e opcional.
- A IA faz pre-preenchimento, nao aprovacao automatica.
- Campos derivados devem ser calculados pelo sistema, nao pela IA.

## Exemplo de regra derivada ja implementada
- Categoria `Paquimetro`:
  - `Incerteza + maior Erro externo` = `Maior erro externo` + `Incerteza de medicao externo`
  - `Incerteza + maior Erro interno` = `Incerteza de medicao interno` + `Maior erro interno`
  - `Incerteza + maior Erro profundidade` = `Maior erro profundidade` + `Incerteza de medicao profundidade`

## Regras de negocio
- O schema principal de dados e `calibracao`.
- Categorias e medidas sao mantidas no banco real.
- Instrumentos sao vinculados a categorias.
- Calibracoes ficam vinculadas ao instrumento.
- Resultados revisados da calibracao ficam serializados no registro e, quando aplicavel, tambem em `calibracao_resultados`.
- Exclusoes sensiveis devem passar por confirmacao explicita.
- Categoria nao pode ser excluida se ainda houver instrumentos vinculados.
- A IA nunca deve inventar valores ausentes do certificado.
- Quando existir calculo tecnico derivado, a fonte de verdade e o codigo da aplicacao.

## Arquitetura
- `Next.js App Router`
- `React`
- `TypeScript`
- `Supabase`
- `Vitest`

## Estrutura de pastas
- `app/`: paginas, layouts e rotas API.
- `app/_components/`: componentes de UI e fluxos.
- `app/api/`: endpoints internos.
- `lib/`: regras de negocio, mapeadores, serializacao, integracoes e helpers.
- `tests/lib/`: testes unitarios da camada de regra.

## Integracoes
- `Supabase Auth`
- `Supabase PostgREST`
- `OpenRouter` para extracao assistida por IA de PDFs

## Banco de dados
- Tabelas principais consumidas hoje:
  - `calibracao.categorias_instrumentos`
  - `calibracao.unidadas_medidas`
  - `calibracao.instrumentos`
  - `calibracao.instrumento_campos_medicao`
  - `calibracao.calibracoes`
  - `calibracao.calibracao_resultados`

## Estado atual do sistema
- Implementado:
  - autenticacao com Supabase
  - dashboard
  - gestao de categorias
  - gestao de medidas
  - gestao de instrumentos
  - detalhe de instrumento
  - log de calibracoes
  - cadastro de nova calibracao
  - cadastro de novo instrumento com calibracao inicial
  - upload de certificado em PDF
  - extracao assistida por IA
  - calculos automaticos por categoria
  - TDD com cobertura
- Em evolucao:
  - ampliar regras derivadas por categoria
  - melhorar a qualidade e a velocidade da IA para PDFs
  - aumentar a cobertura dos testes em `lib/`
  - organizar templates de categoria mais proximos da estrutura das planilhas reais

## Convencoes
- Regras de negocio devem preferencialmente morar em `lib/`.
- Componentes devem ficar mais finos, consumindo helpers testaveis.
- Toda correcao de bug relevante deve voltar com teste.
- Quando uma categoria tiver comportamento proprio, a regra deve ser isolada e testada.
