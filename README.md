# Metrologia PRO

Sistema web interno para controle de instrumentos, templates de calibracao por categoria, prazos de vencimento, historico tecnico de certificados e extracao assistida por IA a partir de PDFs.

## Estado atual
- Aplicacao em `Next.js 15 App Router` com `React 19` e `TypeScript`.
- Persistencia principal em `Supabase`, usando sobretudo o schema `calibracao`.
- Autenticacao via `Supabase Auth`, com protecao de paginas e APIs no `middleware.ts`.
- Dashboard com dados reais.
- CRUD real de categorias e unidades de medida.
- CRUD real de instrumentos.
- Detalhe individual do instrumento com ultimo valor por campo.
- Log de calibracoes por instrumento.
- Cadastro de nova calibracao com upload de PDF.
- Cadastro de novo instrumento em 2 etapas:
  - dados do instrumento
  - certificado e calibracao inicial
- Extracao assistida por IA via `OpenRouter`.
- Regras derivadas locais para a categoria `Paquimetro`.
- Suite de testes unitarios com `Vitest`.

## Fluxos principais

### 1. Categorias
- Cada categoria possui um template de campos de medicao.
- Esses campos podem ter `groupName` e `subgroupName`.
- Ao editar uma categoria, os campos ativos sao sincronizados para os instrumentos ja vinculados.

### 2. Instrumentos
- O fluxo novo recomendado e `app/instrumentos/novo`, em 2 etapas.
- O instrumento herda os campos da categoria.
- A tela de lista ainda possui modal de criacao/edicao rapida, mas sem calibracao inicial.

### 3. Calibracoes
- O cadastro de nova calibracao fica em `app/instrumentos/[id]/calibracoes/nova`.
- O certificado em PDF e obrigatorio.
- O nome do PDF e usado como identificacao padrao no log.
- Os resultados revisados sao serializados em `observacoes` e, quando ha conformidade marcada, tambem em `calibracao_resultados`.

### 4. IA
- A rota `POST /api/calibracoes/extrair` tenta ler o PDF localmente com `pdf-parse`.
- Se conseguir texto suficiente, envia so o texto para o modelo.
- Se nao conseguir, envia o PDF para o modelo da OpenRouter.
- A IA pre-preenche; a aprovacao final continua humana.
- Campos derivados criticos sao calculados no codigo, nao pela IA.

## Stack
- `next@15.5.15`
- `react@19`
- `typescript@5.8`
- `@supabase/supabase-js`
- `vitest`
- `motion`
- `three`
- `pdf-parse`

## Estrutura principal
- `app/`: paginas, layouts, componentes e rotas API.
- `app/_components/`: UI, fluxos de formulario e componentes visuais.
- `app/api/`: endpoints internos protegidos.
- `lib/`: regras de negocio, serializacao, mapeadores e integracoes.
- `lib/server/`: carregamento server-side especifico.
- `lib/supabase/`: clientes e sincronizacao de sessao.
- `tests/lib/`: testes unitarios da camada de regra.

## Variaveis de ambiente

Obrigatorias para a aplicacao subir:

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
OPENROUTER_API_KEY=""
```

Opcionalmente configuraveis:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
OPENROUTER_CALIBRATION_EXTRACTION_MODEL="nvidia/nemotron-nano-12b-v2-vl:free"
SUPABASE_CALIBRATION_CERTIFICATE_BUCKET="shiftapp-files"
SUPABASE_CALIBRATION_CERTIFICATE_FOLDER="metrologia/calibracoes"
```

## Como rodar
```bash
npm install
npm run dev
```

Aplicacao local:
```bash
http://localhost:3000
```

## Testes e validacao
```bash
npm run test
npm run test:tdd
npm run test:coverage
npm run test:ci
```

## Documentacao
- [README.md](./README.md): visao geral e onboarding rapido.
- [CONTEXT.md](./CONTEXT.md): contexto tecnico e de negocio consolidado.
- [HANDOFF_IA.md](./HANDOFF_IA.md): handoff mastigado para outra IA.
- [PRD_Metrologia.md](./PRD_Metrologia.md): escopo e requisitos de produto.
- [TDD.md](./TDD.md): estrategia de testes do projeto.
- [LOGS.md](./LOGS.md): historico das entregas e atualizacoes.

## Ponto de entrada recomendado para outra IA
Se outra IA for trabalhar nesta base, o melhor caminho e:

1. Ler `HANDOFF_IA.md`.
2. Ler `CONTEXT.md`.
3. Conferir as rotas em `app/api/` e os helpers em `lib/`.
4. So depois abrir a tela ou fluxo especifico que sera alterado.
