# Handoff Para Outra IA

## Leia isto primeiro
Este arquivo existe para dar contexto operacional rapido a outra IA que vai trabalhar nesta base. A ideia e reduzir perguntas basicas e evitar mudancas que quebrem regras ja existentes.

## Estado atual (2026-04-21)

Suite de testes: **82 testes passando**, cobertura de statements em **87%+**.

Mudancas recentes importantes (B3 — Dashboard Navegavel):
- `lib/dashboard-metrics.ts`: `DashboardAlert` ganhou `id: number`; `DashboardSummaryCard` ganhou `href: string`
- `app/_components/dashboard-content.tsx`: alertas, cards de resumo e linhas da legenda do donut sao agora `<Link>`; mapeamento `breakdownToneToStatus` (ok→neutral) em escopo de modulo
- `app/_components/instruments-content.tsx`: `useSearchParams` inicializa `calibrationFilter` a partir de `?status`; constante `VALID_CALIBRATION_FILTER_STATUSES` em escopo de modulo
- `app/instrumentos/page.tsx`: `<Suspense fallback={null}>` adicionado

Mudancas anteriores importantes (B1 v2 — SSE + Tabelas):
- `lib/calibration-extraction.ts`: nova funcao `formatTablePagesAsMarkdown`; `buildCalibrationExtractionPrompt` aceita `tableMarkdown` opcional
- `app/api/calibracoes/extrair/route.ts`: endpoint convertido para SSE; emite `status`, `result`, `error`
- `lib/api/extract-sse.ts`: helper `readExtractionSseStream` (async generator)

Proximos passos sugeridos:
- B4: acoes rapidas no dashboard (registrar calibracao sem sair da pagina) ou melhorias de UX na lista de instrumentos.

## Resumo em 30 segundos
- Projeto: sistema interno de metrologia com instrumentos, categorias, calibracoes e certificados
- Banco principal: `Supabase`, schema `calibracao`
- Auth: `Supabase Auth`, protegido por `middleware.ts`
- Fluxo critico: cadastrar instrumento, registrar calibracao, anexar PDF, manter historico
- IA atual: `OpenRouter` para extrair dados de certificados
- Regra especial implementada: `Paquimetro`
- Documentos de apoio:
  - `README.md`
  - `CONTEXT.md`
  - `TDD.md`

## O que existe de verdade na base

### Paginas
- `/login`
- `/dashboard`
- `/categorias`
- `/instrumentos`
- `/instrumentos/novo`
- `/instrumentos/[id]`
- `/instrumentos/[id]/calibracoes`
- `/instrumentos/[id]/calibracoes/nova`
- `/configuracoes`
- `/configuracoes/medidas`

### APIs
- `GET|POST|PATCH|DELETE /api/categorias`
- `GET|POST|PATCH|DELETE /api/medidas`
- `GET|POST|PATCH|DELETE /api/instrumentos`
- `GET /api/instrumentos/metadata`
- `GET|POST /api/calibracoes`
- `POST /api/calibracoes/extrair`
- `GET /api/centro-custo`

## Entidades do dominio

### 1. Categoria
- Define o template de calibracao
- Cada campo pode ter:
  - `name`
  - `measurementId`
  - `groupName`
  - `subgroupName`
  - `slug`
- `slug` do campo depende de `name + groupName + subgroupName`

### 2. Instrumento
- Tem `tag`, `categoria_id`, `fabricante`, `data_ultima_calibracao`, `proxima_calibracao`
- Herda campos da categoria para `instrumento_campos_medicao`

### 3. Calibracao
- Guarda cabecalho da calibracao
- Guarda URL publica do certificado
- Guarda payload estruturado de campos em `observacoes`
- Pode guardar conformidade por campo em `calibracao_resultados`

## Regras que voce nao deve ignorar
- Categoria e a fonte do template
- Instrumento herda o template da categoria
- `fabricante` e opcional
- PDF e obrigatorio para registrar calibracao
- O nome do PDF e fallback de identificacao no log
- IA ajuda no preenchimento, mas nao aprova
- Campos derivados nao podem depender da IA
- `Paquimetro` tem regra especial de calculo local
- Exclusao de categoria com instrumentos vinculados deve falhar

## Fluxo real de novo instrumento

### Fluxo recomendado
Arquivo principal: `app/_components/instrument-create-content.tsx`

1. Carrega categorias e medidas via `GET /api/instrumentos/metadata`
2. Usuario escolhe categoria
3. UI mostra o template herdado da categoria
4. Usuario avanca para etapa do certificado
5. PDF pode ser lido via `POST /api/calibracoes/extrair`
6. Ao salvar:
   - chama `POST /api/instrumentos`
   - carrega detalhe do instrumento criado
   - chama `POST /api/calibracoes`
   - se a calibracao falhar, faz rollback do instrumento

### Importante
- A rota `POST /api/instrumentos` por si so nao cria calibracao
- Quem encadeia criacao de instrumento + calibracao inicial e a tela de `instrumentos/novo`

## Fluxo real de nova calibracao
Arquivo principal: `app/_components/instrument-calibration-create-content.tsx`

1. Carrega o instrumento por `GET /api/instrumentos?id=<id>`
2. Monta a tabela com os campos do instrumento
3. Permite upload do PDF
4. Opcionalmente chama `POST /api/calibracoes/extrair`
5. Aplica regras derivadas locais
6. Salva via `POST /api/calibracoes`
7. Atualiza `data_ultima_calibracao` e `proxima_calibracao` no instrumento

## Como a extracao por IA funciona
Arquivo principal: `app/api/calibracoes/extrair/route.ts`

### Pipeline
1. valida API key e arquivo
2. resolve os campos do instrumento
3. tenta extrair texto e tabelas do PDF com `pdf-parse`
4. monta schema JSON dinamico com os `field_slug` validos
5. chama `OpenRouter`
6. se `json_schema` nao for suportado pelo modelo, tenta fallback
7. normaliza retorno
8. aplica overrides locais de parser para certificados conhecidos

### Detalhes importantes
- Quando ha texto suficiente, o prompt usa so texto extraido
- Quando nao ha texto suficiente, o endpoint envia o PDF ao modelo
- Timeout e menor para modelos `:free`
- Hoje existe um parser local para certos certificados de `Paquimetro`

## Onde moram as regras importantes
- `lib/measurements.ts`
  - serializa e formata medidas
- `lib/measurement-fields.ts`
  - slug de campo
  - agrupamento por grupo/subgrupo
- `lib/instruments.ts`
  - prazo de calibracao
  - tom de alerta
  - tag fallback
- `lib/calibrations.ts`
  - filtros do log
  - status da calibracao
  - mapeamento de historico
- `lib/calibration-records.ts`
  - payload estruturado dentro de `observacoes`
- `lib/calibration-derivations.ts`
  - calculos automaticos por categoria
- `lib/calibration-certificate-parsers.ts`
  - leitura local de tabelas conhecidas

## Estrutura de dados que costuma confundir

### `observacoes` nao e sempre texto puro
O sistema pode serializar um bloco estruturado assim:

```text
[[METROLOGIA_CALIBRATION_DATA]]
{"version":1,"fields":[...]}
[[/METROLOGIA_CALIBRATION_DATA]]
texto livre opcional
```

Se voce mexer em historico de calibracao, precisa preservar isso.

### `calibracao_resultados` nao guarda tudo
- Ele guarda principalmente a conformidade por campo
- Os valores completos ficam no payload serializado de `observacoes`

## Schemas e storage

### Schema `calibracao`
- `categorias_instrumentos`
- `categoria_campos_medicao`
- `unidadas_medidas`
- `instrumentos`
- `instrumento_campos_medicao`
- `calibracoes`
- `calibracao_resultados`

### Storage
- Bucket default: `shiftapp-files`
- Pasta default: `metrologia/calibracoes`
- Helper: `lib/calibration-certificates.ts`

## Variaveis de ambiente

Obrigatorias:

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
OPENROUTER_API_KEY=""
```

Opcionais:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
OPENROUTER_CALIBRATION_EXTRACTION_MODEL="nvidia/nemotron-nano-12b-v2-vl:free"
SUPABASE_CALIBRATION_CERTIFICATE_BUCKET="shiftapp-files"
SUPABASE_CALIBRATION_CERTIFICATE_FOLDER="metrologia/calibracoes"
```

## Cuidados antes de alterar algo
- Nao mexa em `slug` de campo sem entender `groupName` e `subgroupName`
- Nao transforme `observacoes` em texto simples sem preservar o payload estruturado
- Nao empurre calculo de negocio para a IA
- Nao trate toda categoria como se fosse generica; `Paquimetro` ja foge disso
- Nao assuma que criar instrumento significa criar calibracao; isso e fluxo da UI, nao regra do endpoint

## Armadilhas atuais
- A tela `/instrumentos` ainda tem modal de criacao/edicao rapida alem do fluxo novo em `/instrumentos/novo`
- O backend de calibracao ainda aceita `laboratory` e `certificate`, mesmo que a UI atual nao exponha esses campos
- O projeto usa bastante `supabaseAdmin`; erros de permissao aparecem como erro de schema/chave de servico
- Alguns textos na UI podem aparecer com encoding ruim dependendo do terminal, mas os arquivos estao em bom estado

## Como se orientar no codigo
Se a tarefa for:

### Categoria ou template
- olhar `app/_components/categories-content.tsx`
- olhar `app/api/categorias/route.ts`
- olhar `lib/measurement-fields.ts`

### Medidas
- olhar `app/_components/settings-content.tsx`
- olhar `app/api/medidas/route.ts`
- olhar `lib/measurements.ts`

### Instrumentos
- olhar `app/_components/instruments-content.tsx`
- olhar `app/_components/instrument-create-content.tsx`
- olhar `app/api/instrumentos/route.ts`
- olhar `lib/instruments.ts`

### Calibracoes
- olhar `app/_components/instrument-calibration-create-content.tsx`
- olhar `app/_components/instrument-calibrations-content.tsx`
- olhar `app/api/calibracoes/route.ts`
- olhar `lib/calibrations.ts`
- olhar `lib/calibration-records.ts`

### Extracao por IA
- olhar `app/api/calibracoes/extrair/route.ts`
- olhar `lib/calibration-extraction.ts`
- olhar `lib/calibration-certificate-parsers.ts`
- olhar `lib/calibration-derivations.ts`

## Como validar alteracoes
- Regra pura: `npm run test`
- Mudanca grande de regra: `npm run test:coverage`
- Fluxo real de app: `npm run build`

## Regra de ouro para trabalhar aqui
Se houver duvida entre deixar a logica na IA ou no codigo, deixe no codigo.
