# Contexto do Projeto

## Resumo executivo
- Nome: `Metrologia PRO`
- Dominio: controle interno de instrumentos e calibracoes
- Objetivo: substituir controles manuais e planilhas por uma aplicacao auditavel com historico tecnico, prazos e apoio de IA para leitura de certificados
- Stack central: `Next.js App Router`, `React 19`, `TypeScript`, `Supabase`, `Vitest`

## O que o sistema faz hoje
- Login com `Supabase Auth`
- Dashboard com metricas reais do parque de instrumentos
- Gestao de categorias
- Gestao de unidades de medida
- Gestao de instrumentos
- Detalhe de instrumento com ultimo valor por campo
- Log historico de calibracoes por instrumento
- Cadastro de nova calibracao com upload de PDF
- Cadastro de novo instrumento com calibracao inicial
- Extracao assistida por IA de certificados em PDF
- Calculos derivados locais para `Paquimetro`

## Arquitetura real

### Frontend
- `app/layout.tsx`: layout raiz, `AuthSessionSync`, inicializacao de tema e escala de fonte
- `app/login/page.tsx`: login visual com `LightPillar`, `BorderGlow` e `ShinyText`
- `app/dashboard/page.tsx`: dashboard server-side
- `app/categorias/page.tsx`: CRUD de categorias e template de campos
- `app/instrumentos/page.tsx`: lista, filtros, modal de edicao e exclusao
- `app/instrumentos/novo/page.tsx`: fluxo novo recomendado para cadastrar instrumento com calibracao inicial
- `app/instrumentos/[id]/page.tsx`: detalhe do instrumento
- `app/instrumentos/[id]/calibracoes/page.tsx`: log de calibracoes
- `app/instrumentos/[id]/calibracoes/nova/page.tsx`: nova calibracao
- `app/configuracoes/page.tsx`: hub de configuracoes
- `app/configuracoes/medidas/page.tsx`: CRUD de medidas
- `app/inventario/page.tsx`: hoje apenas redireciona para `/instrumentos`

### Backend
- APIs internas em `app/api/**`
- Regras e mapeadores em `lib/**`
- A maioria das consultas usa `supabaseAdmin` com `SUPABASE_SERVICE_ROLE_KEY`
- APIs e paginas protegidas via `middleware.ts`

## Autenticacao e acesso
- O frontend usa `supabaseBrowser`
- O `fetchApi` injeta `Authorization: Bearer <access_token>` automaticamente
- O `middleware.ts` valida sessao por bearer token ou cookies locais:
  - `metrologia-access-token`
  - `metrologia-refresh-token`
- Rotas protegidas:
  - paginas: `/dashboard`, `/instrumentos`, `/categorias`, `/configuracoes`, `/inventario`
  - APIs: `/api/calibracoes`, `/api/categorias`, `/api/centro-custo`, `/api/instrumentos`, `/api/medidas`

## Schemas e tabelas relevantes

### Schema `calibracao`
- `categorias_instrumentos`
- `categoria_campos_medicao`
- `unidadas_medidas`
- `instrumentos`
- `instrumento_campos_medicao`
- `calibracoes`
- `calibracao_resultados`

### Schema `datasul`
- `centro_custo`
- usado apenas em `GET /api/centro-custo`

## Regras de negocio que ja existem
- Categoria define o template de calibracao
- Instrumento herda os campos ativos da categoria
- Ao editar categoria, os campos dos instrumentos vinculados sao sincronizados
- `fabricante` e opcional
- O fluxo novo de instrumento e em 2 etapas
- O PDF do certificado e obrigatorio no cadastro de calibracao
- O nome do PDF vira fallback de identificacao no log
- A IA nao deve inventar valores ausentes
- Campos derivados devem ser calculados localmente
- Exclusoes sensiveis exigem confirmacao explicita na UI
- Categoria nao pode ser excluida se houver instrumentos vinculados

## Regras derivadas implementadas hoje
- Categoria `Paquimetro`
- Campos auto calculados:
  - `Incerteza + maior Erro externo`
  - `Incerteza + maior Erro interno`
  - `Incerteza + maior Erro profundidade`
  - `Incerteza + maior Erro ressalto`
- Fonte: `lib/calibration-derivations.ts`

## Como a calibracao e armazenada
- `calibracoes` guarda cabecalho da calibracao
- `observacoes` pode conter:
  - notas livres
  - payload estruturado entre os marcadores:
    - `[[METROLOGIA_CALIBRATION_DATA]]`
    - `[[/METROLOGIA_CALIBRATION_DATA]]`
- `calibracao_resultados` guarda apenas a conformidade por campo quando houver revisao marcada
- O certificado PDF vai para `Supabase Storage`

## Extracao assistida por IA
- Provider: `OpenRouter`
- Modelo default: `nvidia/nemotron-nano-12b-v2-vl:free`
- Fluxo:
  1. valida PDF e tamanho
  2. tenta ler texto e tabelas com `pdf-parse`
  3. se houver texto suficiente, monta prompt com texto
  4. se nao houver, envia o PDF como `data:` URL para o modelo
  5. normaliza o JSON de retorno
  6. aplica overrides locais para certificados conhecidos de `Paquimetro`
- Observacao importante: a IA ajuda no preenchimento; os calculos confiaveis continuam no codigo

## Endpoints internos

### Categorias
- `GET /api/categorias`
- `POST /api/categorias`
- `PATCH /api/categorias`
- `DELETE /api/categorias`

### Medidas
- `GET /api/medidas`
- `POST /api/medidas`
- `PATCH /api/medidas`
- `DELETE /api/medidas`

### Instrumentos
- `GET /api/instrumentos`
- `GET /api/instrumentos?id=<id>`
- `POST /api/instrumentos`
- `PATCH /api/instrumentos`
- `DELETE /api/instrumentos`
- `GET /api/instrumentos/metadata`

### Calibracoes
- `GET /api/calibracoes?instrumentId=<id>&period=1y`
- `GET /api/calibracoes?instrumentId=<id>&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`
- `POST /api/calibracoes`
- `POST /api/calibracoes/extrair`

### Centro de custo
- `GET /api/centro-custo?code=<codigo>`

## Arquivos centrais por responsabilidade
- `lib/measurements.ts`: normalizacao e serializacao de unidades de medida
- `lib/measurement-fields.ts`: slug, agrupamento e layout de campos
- `lib/instruments.ts`: mapeamento de instrumento, tags, prazo e merge com ultima calibracao
- `lib/calibrations.ts`: filtros, status e historico
- `lib/calibration-records.ts`: serializacao estruturada dentro de `observacoes`
- `lib/calibration-extraction.ts`: prompt, schema e normalizacao de extracao
- `lib/calibration-certificate-parsers.ts`: parser local de certificados conhecidos
- `lib/calibration-certificates.ts`: validacao e path de storage
- `lib/dashboard-metrics.ts`: metricas do dashboard

## Decisoes operacionais importantes
- A rota `/instrumentos/novo` e o fluxo mais completo para cadastro
- A lista `/instrumentos` ainda oferece criacao/edicao rapida por modal, mas sem calibracao inicial
- O backend de `instrumentos` aceita `fields`, porem o frontend atual quase sempre parte do template da categoria
- `laboratory` e `certificate` continuam aceitos no endpoint de calibracao, mesmo que a UI atual nao exponha esses campos
- `buildInstrumentDisplayTag` existe como fallback, mas o sistema usa a `tag` salva sempre que ela nao parecer um UUID

## Convencoes para evolucao
- Regras de negocio devem preferir `lib/`
- Componentes devem ficar o mais finos possivel
- Toda correcao relevante de regra deve vir com teste
- Se uma categoria tiver comportamento proprio, a regra deve ficar isolada e testada
- Antes de mexer em fluxos de calibracao, sempre conferir:
  - `lib/calibration-derivations.ts`
  - `lib/calibration-records.ts`
  - `app/api/calibracoes/route.ts`
  - `app/api/calibracoes/extrair/route.ts`

## Pontos que outra IA precisa saber antes de editar
- Nem toda regra esta no componente; muita coisa relevante esta em `lib/`
- O projeto usa `schema("calibracao")` em quase todas as consultas
- `observacoes` nao e texto puro em todos os casos; pode conter JSON embutido
- Os campos de categoria e instrumento usam `slug` derivado de `name + groupName + subgroupName`
- Alterar a categoria impacta templates de instrumentos ja existentes
- `Paquimetro` tem comportamento especial e nao pode ser tratado como categoria comum
