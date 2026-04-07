# Metrologia PRO

Sistema web para controle de instrumentos, categorias, unidades de medida, prazos de calibracao e rotinas metrologicas internas.

## Visao Geral
- Aplicacao construída com Next.js App Router e TypeScript.
- Persistencia principal em Supabase, usando o schema `calibracao`.
- Interface focada em operacao interna, cadastro tecnico e acompanhamento de conformidade.

## Stack
- Next.js
- React
- TypeScript
- Supabase
- CSS global
- CSS Modules
- Three.js
- Motion

## Estrutura Principal
- `app/`
  - Paginas da aplicacao
  - Rotas API
  - Componentes visuais
- `app/_components/`
  - Componentes reutilizaveis como `LightPillar`, `ShinyText` e `BorderGlow`
- `lib/`
  - Serializacao, mapeamento e metricas
- `public/`
  - Assets estaticos

## Funcionalidades Implementadas
- CRUD real de unidades de medida
- CRUD real de categorias
- CRUD real de instrumentos
- Dashboard com dados reais do projeto
- Detalhe individual por instrumento
- Campos padrao por categoria
- Campos extras configuraveis por instrumento
- Confirmacoes de exclusao em fluxos sensiveis
- Acessibilidade basica de fonte em configuracoes
- Tela de login redesenhada com:
  - fundo `LightPillar`
  - titulo com `ShinyText`
  - card com `BorderGlow`
  - validacao visual com shake e mensagem inline

## Principais Rotas
- `/login`
- `/dashboard`
- `/instrumentos`
- `/instrumentos/[id]`
- `/configuracoes`
- `/configuracoes/medidas`

## Rotas API
- `/api/medidas`
- `/api/categorias`
- `/api/instrumentos`
- `/api/instrumentos/metadata`
- `/api/centro-custo`

## Banco de Dados
Schema principal:
- `calibracao`

Tabelas relevantes:
- `categorias_instrumentos`
- `unidadas_medidas`
- `instrumentos`
- `categoria_campos_medicao`
- `instrumento_campos_medicao`
- `calibracoes`
- `calibracao_resultados`

## Variaveis de Ambiente
Esperadas no projeto:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Como Rodar
```bash
npm install
npm run dev
```

Aplicacao local:
```bash
http://localhost:3000
```

## Status Atual
- Base principal ligada ao schema `calibracao`
- Login em refinamento visual
- Dashboard funcional com foco em metrologia
- Instrumentos, categorias e medidas operando com persistencia real

## Documentacao
- [CONTEXT.md](/c:/Metrologia/CONTEXT.md)
- [LOGS.md](/c:/Metrologia/LOGS.md)
- [PRD_Metrologia.md](/c:/Metrologia/PRD_Metrologia.md)
