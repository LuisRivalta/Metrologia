---
tags: [historico, plano, docs]
feature: Obsidian Wiki Reorganização
data: 2026-04-22
---
# Obsidian Wiki — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar toda a documentação do projeto em `docs/` com categorias claras e criar uma camada wiki de módulos de código, permitindo que uma IA navegue a documentação e entenda qualquer arquivo antes de abri-lo.

**Architecture:** Dois arquivos ficam na raiz (`CLAUDE.md`, `README.md`). Todos os demais `.md` vão para `docs/` organizado em 8 categorias (`estado/`, `produto/`, `arquitetura/`, `dominio/`, `modulos/`, `componentes/`, `api/`, `testes/`, `historico/`). Cada doc de módulo/componente/API inclui links Obsidian `[[...]]` para os arquivos de código reais, gerando a teia visível no graph view.

**Tech Stack:** Markdown, Obsidian wiki links `[[...]]`, YAML frontmatter, git

---

## Files

| Ação | Arquivo |
|------|---------|
| Mover | `HANDOFF_IA.md` → `docs/estado/HANDOFF_IA.md` |
| Mover | `LOGS.md` → `docs/estado/LOGS.md` |
| Mover | `PRD_Metrologia.md` → `docs/produto/PRD.md` |
| Mover | `TDD.md` → `docs/testes/TDD.md` |
| Mover | `docs/superpowers/specs/*` → `docs/historico/specs/*` |
| Mover | `docs/superpowers/plans/*` → `docs/historico/planos/*` |
| Deletar | `CONTEXT.md` (conteúdo fragmentado nas novas categorias) |
| Deletar | `docs/superpowers/` (pasta vazia após migração) |
| Criar | `docs/00-INDEX.md` |
| Criar | `docs/arquitetura/visao-geral.md` |
| Criar | `docs/arquitetura/data-layer.md` |
| Criar | `docs/arquitetura/ia-pipeline.md` |
| Criar | `docs/dominio/modelo.md` |
| Criar | `docs/dominio/regras-criticas.md` |
| Criar | `docs/dominio/campo-slugs.md` |
| Criar | `docs/modulos/calibration-records.md` |
| Criar | `docs/modulos/calibration-derivations.md` |
| Criar | `docs/modulos/calibration-certificate-parsers.md` |
| Criar | `docs/modulos/calibration-certificates.md` |
| Criar | `docs/modulos/calibration-extraction.md` |
| Criar | `docs/modulos/calibrations.md` |
| Criar | `docs/modulos/dashboard-metrics.md` |
| Criar | `docs/modulos/instruments.md` |
| Criar | `docs/modulos/measurements.md` |
| Criar | `docs/modulos/measurement-fields.md` |
| Criar | `docs/modulos/categories.md` |
| Criar | `docs/componentes/instrument-create-flow.md` |
| Criar | `docs/componentes/calibration-create-flow.md` |
| Criar | `docs/componentes/dashboard-content.md` |
| Criar | `docs/componentes/instruments-content.md` |
| Criar | `docs/api/calibracoes-extrair.md` |
| Criar | `docs/api/calibracoes.md` |
| Criar | `docs/api/instrumentos.md` |
| Criar | `docs/api/categorias.md` |
| Atualizar | `CLAUDE.md` (paths + referência ao INDEX) |
| Atualizar | `README.md` (thin) |

---

### Task 1: Criar estrutura de pastas e mover arquivos existentes

**Files:**
- Move: `HANDOFF_IA.md` → `docs/estado/HANDOFF_IA.md`
- Move: `LOGS.md` → `docs/estado/LOGS.md`
- Move: `PRD_Metrologia.md` → `docs/produto/PRD.md`
- Move: `TDD.md` → `docs/testes/TDD.md`
- Move: `docs/superpowers/specs/*.md` → `docs/historico/specs/*.md`
- Move: `docs/superpowers/plans/*.md` → `docs/historico/planos/*.md`

- [ ] **Step 1: Criar todas as pastas necessárias**

```bash
mkdir -p docs/estado docs/produto docs/arquitetura docs/dominio docs/modulos docs/componentes docs/api docs/testes docs/historico/specs docs/historico/planos
```

- [ ] **Step 2: Mover os arquivos de raiz**

```bash
git mv HANDOFF_IA.md docs/estado/HANDOFF_IA.md
git mv LOGS.md docs/estado/LOGS.md
git mv PRD_Metrologia.md docs/produto/PRD.md
git mv TDD.md docs/testes/TDD.md
```

- [ ] **Step 3: Mover specs e planos existentes**

```bash
git mv docs/superpowers/specs/2026-04-18-b2-calibration-flow-design.md docs/historico/specs/2026-04-18-b2-calibration-flow-design.md
git mv docs/superpowers/specs/2026-04-18-technical-health-design.md docs/historico/specs/2026-04-18-technical-health-design.md
git mv docs/superpowers/specs/2026-04-20-b1-ai-pipeline-design.md docs/historico/specs/2026-04-20-b1-ai-pipeline-design.md
git mv docs/superpowers/specs/2026-04-21-ai-pipeline-design.md docs/historico/specs/2026-04-21-ai-pipeline-design.md
git mv docs/superpowers/specs/2026-04-21-b3-dashboard-navigation-design.md docs/historico/specs/2026-04-21-b3-dashboard-navigation-design.md
git mv docs/superpowers/specs/2026-04-22-obsidian-wiki-design.md docs/historico/specs/2026-04-22-obsidian-wiki-design.md
git mv docs/superpowers/plans/2026-04-18-b2-calibration-flow.md docs/historico/planos/2026-04-18-b2-calibration-flow.md
git mv docs/superpowers/plans/2026-04-18-technical-health.md docs/historico/planos/2026-04-18-technical-health.md
git mv docs/superpowers/plans/2026-04-20-b1-ai-pipeline.md docs/historico/planos/2026-04-20-b1-ai-pipeline.md
git mv docs/superpowers/plans/2026-04-21-ai-pipeline-b1.md docs/historico/planos/2026-04-21-ai-pipeline-b1.md
git mv docs/superpowers/plans/2026-04-21-b3-dashboard-navigation.md docs/historico/planos/2026-04-21-b3-dashboard-navigation.md
git mv docs/superpowers/plans/2026-04-22-obsidian-wiki.md docs/historico/planos/2026-04-22-obsidian-wiki.md
```

- [ ] **Step 4: Remover pasta superpowers vazia**

Após o `git mv`, a pasta fica fisicamente vazia. Removê-la:

```bash
rm -rf docs/superpowers
```

- [ ] **Step 5: Deletar CONTEXT.md da raiz** (conteúdo vai para arquitetura/ e dominio/ nos próximos tasks)

```bash
git rm CONTEXT.md
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: reorganize docs into categorized wiki structure"
```

---

### Task 2: Criar docs/00-INDEX.md e docs de arquitetura

**Files:**
- Create: `docs/00-INDEX.md`
- Create: `docs/arquitetura/visao-geral.md`
- Create: `docs/arquitetura/data-layer.md`
- Create: `docs/arquitetura/ia-pipeline.md`

- [ ] **Step 1: Criar docs/00-INDEX.md**

Conteúdo completo:

```markdown
---
tags: [index, hub]
---

# Índice do Wiki — Metrologia PRO

Ponto de entrada para qualquer IA navegar a documentação antes de tocar no código.

## Onde estamos agora
- [[estado/HANDOFF_IA]] — estado operacional atual, próximos passos, armadilhas
- [[estado/LOGS]] — histórico cronológico de todas as entregas

## O que estamos construindo
- [[produto/PRD]] — escopo funcional, requisitos, roadmap

## Como o sistema funciona
- [[arquitetura/visao-geral]] — stack, request path, autenticação
- [[arquitetura/data-layer]] — schemas Supabase, formato observacoes, storage
- [[arquitetura/ia-pipeline]] — pipeline OpenRouter, SSE, fallback de modelo

## Regras do domínio
- [[dominio/modelo]] — entidades e relações (Categoria → Instrumento → Calibração)
- [[dominio/regras-criticas]] — regras que não podem quebrar
- [[dominio/campo-slugs]] — como slugs de campos são derivados

## Módulos lib/
- [[modulos/calibration-records]] → `lib/calibration-records.ts`
- [[modulos/calibration-derivations]] → `lib/calibration-derivations.ts`
- [[modulos/calibration-extraction]] → `lib/calibration-extraction.ts`
- [[modulos/calibration-certificate-parsers]] → `lib/calibration-certificate-parsers.ts`
- [[modulos/calibration-certificates]] → `lib/calibration-certificates.ts`
- [[modulos/calibrations]] → `lib/calibrations.ts`
- [[modulos/instruments]] → `lib/instruments.ts`
- [[modulos/measurements]] → `lib/measurements.ts`
- [[modulos/measurement-fields]] → `lib/measurement-fields.ts`
- [[modulos/dashboard-metrics]] → `lib/dashboard-metrics.ts`
- [[modulos/categories]] → `lib/categories.ts`

## Componentes complexos
- [[componentes/instrument-create-flow]] → `app/_components/instrument-create-content.tsx`
- [[componentes/calibration-create-flow]] → `app/_components/instrument-calibration-create-content.tsx`
- [[componentes/dashboard-content]] → `app/_components/dashboard-content.tsx`
- [[componentes/instruments-content]] → `app/_components/instruments-content.tsx`

## API Routes
- [[api/calibracoes-extrair]] → `POST /api/calibracoes/extrair`
- [[api/calibracoes]] → `GET|POST /api/calibracoes`
- [[api/instrumentos]] → `GET|POST|PATCH|DELETE /api/instrumentos`
- [[api/categorias]] → `GET|POST|PATCH|DELETE /api/categorias`

## Testes
- [[testes/TDD]] — estratégia, comandos, convenções

## Histórico de entregas
- [[estado/LOGS]] — log de sessões
- `docs/historico/specs/` — design specs por feature
- `docs/historico/planos/` — planos de implementação
```

- [ ] **Step 2: Criar docs/arquitetura/visao-geral.md**

```markdown
---
tags: [arquitetura]
---

# Visão Geral da Arquitetura

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 App Router |
| UI | React 19, TypeScript 5.8 |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| IA | OpenRouter (`nvidia/nemotron-nano-12b-v2-vl:free`) |
| Testes | Vitest + v8 coverage |
| Animações | motion, three |
| PDF | pdf-parse |

## Request Path

```
Browser → fetchApi (injeta Bearer token) → middleware.ts (valida sessão) → API Route (supabaseAdmin) → Supabase
```

- `lib/api/fetch-api.ts` injeta `Authorization: Bearer <access_token>` automaticamente
- `middleware.ts` valida por bearer token ou cookies `metrologia-access-token` / `metrologia-refresh-token`
- API routes usam `supabaseAdmin` (service role key) — nunca o browser client

## Estrutura de Pastas

```
app/              ← páginas, layouts, componentes, rotas API
app/_components/  ← UI, formulários, componentes visuais
app/api/          ← endpoints internos protegidos
lib/              ← regras de negócio, serializadores, mapeadores
lib/server/       ← carregamento server-side (RSC)
lib/supabase/     ← clientes Supabase e sync de sessão
tests/lib/        ← testes unitários da camada lib/
```

## Páginas

| Rota | Descrição |
|------|-----------|
| `/login` | Login com Supabase Auth |
| `/dashboard` | Métricas reais do parque |
| `/categorias` | CRUD de categorias e templates |
| `/instrumentos` | Lista com filtros |
| `/instrumentos/novo` | Fluxo 2 etapas: dados + calibração inicial |
| `/instrumentos/[id]` | Detalhe do instrumento |
| `/instrumentos/[id]/calibracoes` | Histórico de calibrações |
| `/instrumentos/[id]/calibracoes/nova` | Nova calibração |
| `/configuracoes/medidas` | CRUD de unidades de medida |

## Relacionado
- [[arquitetura/data-layer]] — banco e schemas
- [[arquitetura/ia-pipeline]] — pipeline de extração
- [[dominio/modelo]] — entidades do domínio
- [[estado/HANDOFF_IA]] — estado atual
```

- [ ] **Step 3: Criar docs/arquitetura/data-layer.md**

```markdown
---
tags: [arquitetura, banco]
---

# Data Layer

## Clientes Supabase

| Cliente | Arquivo | Uso |
|---------|---------|-----|
| `supabaseAdmin` | `lib/supabase/admin.ts` | API routes (service role key) |
| `supabaseBrowser` | `lib/supabase/browser.ts` | Frontend (anon key) |

Toda query de negócio usa `.schema("calibracao")` — sem exceção.

## Schema `calibracao` — Tabelas

| Tabela | Descrição |
|--------|-----------|
| `categorias_instrumentos` | Categorias com nome e slug |
| `categoria_campos_medicao` | Campos template de cada categoria |
| `unidadas_medidas` | Unidades de medida |
| `instrumentos` | Instrumentos com tag, categoria, fabricante, datas |
| `instrumento_campos_medicao` | Campos herdados do template da categoria |
| `calibracoes` | Cabeçalho + PDF + payload estruturado |
| `calibracao_resultados` | Conformidade por campo (quando revisado) |

## Schema `datasul`

- `centro_custo` — usado apenas em `GET /api/centro-custo`

## Formato dual de `observacoes`

O campo `calibracoes.observacoes` não é sempre texto puro. Pode conter:

```
[[METROLOGIA_CALIBRATION_DATA]]
{"version":1,"fields":[...]}
[[/METROLOGIA_CALIBRATION_DATA]]
texto livre opcional
```

Sempre usar `lib/calibration-records.ts` para ler/escrever este campo. Nunca tratar como texto puro sem antes parsear.

## Storage de Certificados

- Bucket: `shiftapp-files` (env: `SUPABASE_CALIBRATION_CERTIFICATE_BUCKET`)
- Pasta: `metrologia/calibracoes` (env: `SUPABASE_CALIBRATION_CERTIFICATE_FOLDER`)
- Path: `{folder}/{tag-slugificada}/calibracao-{id}-{timestamp}-{nome-arquivo}.pdf`
- Helper: `lib/calibration-certificates.ts`

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
OPENROUTER_API_KEY=""
# Opcionais:
NEXT_PUBLIC_APP_URL="http://localhost:3000"
OPENROUTER_CALIBRATION_EXTRACTION_MODEL="nvidia/nemotron-nano-12b-v2-vl:free"
OPENROUTER_FALLBACK_MODEL=""
SUPABASE_CALIBRATION_CERTIFICATE_BUCKET="shiftapp-files"
SUPABASE_CALIBRATION_CERTIFICATE_FOLDER="metrologia/calibracoes"
```

## Relacionado
- [[modulos/calibration-records]] — serialização de observacoes
- [[modulos/calibration-certificates]] — paths e validação de storage
- [[arquitetura/visao-geral]] — visão geral da stack
```

- [ ] **Step 4: Criar docs/arquitetura/ia-pipeline.md**

```markdown
---
tags: [arquitetura, ia]
---

# Pipeline de Extração por IA

## Visão Geral

A IA lê o PDF do certificado e sugere valores para os campos. O usuário revisa antes de salvar. Campos derivados nunca são calculados pela IA.

## Rota

`POST /api/calibracoes/extrair` — `app/api/calibracoes/extrair/route.ts`

Responde com **SSE** (`text/event-stream`). Erros de validação retornam JSON 4xx.

## Eventos SSE

| Evento | Quando |
|--------|--------|
| `status: reading_pdf` | Início da leitura do PDF |
| `status: calling_ai` | Enviando para OpenRouter |
| `status: processing` | Normalizando resposta |
| `result` | Resultado final com `CalibrationExtractionResult` |
| `error` | Falha controlada com mensagem |

## Pipeline Passo a Passo

1. Valida API key e arquivo PDF (tamanho ≤ 10 MB, tipo `.pdf`)
2. Resolve campos do instrumento via banco
3. Tenta ler texto e tabelas com `pdf-parse`
4. Se texto suficiente (≥ 120 chars sem espaços): usa só texto + tabelas Markdown
5. Se insuficiente: envia PDF como `data:` URL para o modelo
6. Monta schema JSON dinâmico com slugs válidos (`buildCalibrationExtractionSchema`)
7. Chama OpenRouter (`runExtractionAttempt`)
8. Se modelo não suporta `json_schema`: retry com `json_object`
9. Se timeout (AbortError) ou 503: fallback para `OPENROUTER_FALLBACK_MODEL`
10. Normaliza resposta (`normalizeCalibrationExtractionResult`)
11. Aplica overrides locais de parser para certificados conhecidos de Paquímetro

## Modelos

- Default: `nvidia/nemotron-nano-12b-v2-vl:free` (env: `OPENROUTER_CALIBRATION_EXTRACTION_MODEL`)
- Fallback: env `OPENROUTER_FALLBACK_MODEL` (acionado em timeout ou 503)
- Timeout menor para modelos `:free`

## Logging

`logExtractionAttempt` emite JSON estruturado no console após cada tentativa:
`{ event, model, attempt, status, ok, fields_filled, raw_response_snippet }`

## Relacionado
- [[modulos/calibration-extraction]] — prompt, schema, normalização
- [[modulos/calibration-certificate-parsers]] — overrides locais de Paquímetro
- [[componentes/calibration-create-flow]] — consumidor do SSE
- [[componentes/instrument-create-flow]] — consumidor do SSE
- [[api/calibracoes-extrair]] — doc detalhado do endpoint
```

- [ ] **Step 5: Commit**

```bash
git add docs/00-INDEX.md docs/arquitetura/
git commit -m "docs: add wiki index and architecture docs"
```

---

### Task 3: Criar docs de domínio

**Files:**
- Create: `docs/dominio/modelo.md`
- Create: `docs/dominio/regras-criticas.md`
- Create: `docs/dominio/campo-slugs.md`

- [ ] **Step 1: Criar docs/dominio/modelo.md**

```markdown
---
tags: [dominio, modelo]
---

# Modelo de Domínio

## Hierarquia

```
Categoria
  └─ define template de campos (categoria_campos_medicao)
       └─ Instrumento
            └─ herda campos via instrumento_campos_medicao
                 └─ Calibração
                      ├─ cabeçalho (datas, responsável, PDF)
                      ├─ payload estruturado em observacoes
                      └─ calibracao_resultados (conformidade por campo)
```

## Categoria

- Define o **template** de calibração reutilizável
- Campos com: `name`, `measurementId`, `groupName`, `subgroupName`, `slug`, `hint`
- Ao editar categoria: campos dos instrumentos vinculados são sincronizados
- Não pode ser deletada se houver instrumentos vinculados

## Instrumento

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `tag` | string | sim (ou gerado) |
| `categoria_id` | number | sim |
| `fabricante` | string | não |
| `data_ultima_calibracao` | date | não |
| `proxima_calibracao` | date | não |

- Herda campos da categoria via `instrumento_campos_medicao`
- Tag salva tem prioridade; se parecer UUID, usa `buildInstrumentDisplayTag`

## Calibração

| Campo | Tipo | Notas |
|-------|------|-------|
| `data_calibracao` | date | obrigatório |
| `arquivo_certificado_url` | string | PDF obrigatório |
| `observacoes` | text | pode conter JSON estruturado |
| `calibracao_resultados` | tabela | conformidade por campo (opcional) |

- PDF upload é obrigatório para criar calibração
- Nome do PDF serve como fallback de identificação no log
- `calibracao_resultados` guarda conformidade; valores completos ficam em `observacoes`

## Relacionado
- [[arquitetura/data-layer]] — schemas e tabelas reais
- [[dominio/regras-criticas]] — regras que não podem quebrar
- [[dominio/campo-slugs]] — como slugs funcionam
- [[modulos/calibration-records]] — serialização de observacoes
```

- [ ] **Step 2: Criar docs/dominio/regras-criticas.md**

```markdown
---
tags: [dominio, regras]
---

# Regras Críticas do Domínio

Regras que não podem ser violadas sem quebrar o sistema.

## 1. PDF é obrigatório

Toda calibração exige upload de certificado em PDF. O backend valida antes de salvar.

## 2. IA só sugere — nunca aprova

A extração por IA pré-preenche campos. O usuário revisa e confirma. Nenhum valor da IA é salvo automaticamente.

## 3. Campos derivados são calculados no código

Campos como "Incerteza + maior Erro" do Paquímetro são calculados em `lib/calibration-derivations.ts`. A IA não calcula esses campos — se tentar sugerir, o código sobrescreve.

## 4. Paquímetro é categoria especial

Única categoria com regras de derivação locais implementadas. Não tratar como categoria genérica. Regras em `lib/calibration-derivations.ts`, parsers locais em `lib/calibration-certificate-parsers.ts`.

## 5. Categoria não pode ser deletada com instrumentos vinculados

O backend rejeita a deleção se existirem instrumentos usando a categoria.

## 6. observacoes tem formato dual

O campo `calibracoes.observacoes` pode conter JSON estruturado dentro dos marcadores `[[METROLOGIA_CALIBRATION_DATA]]`. Nunca sobrescrever como texto puro. Sempre usar `lib/calibration-records.ts`.

## 7. Slug de campo é derivado — não arbitrário

`slug = serializeMeasurementFieldSlug(name + groupName + subgroupName)`. Alterar qualquer um desses campos independentemente quebra o link entre template e registros existentes.

## 8. Criar instrumento ≠ criar calibração

A rota `POST /api/instrumentos` não cria calibração. Quem orquestra instrumento + calibração inicial é a tela `/instrumentos/novo`.

## Relacionado
- [[dominio/campo-slugs]] — como slugs são derivados
- [[modulos/calibration-derivations]] — regras de derivação do Paquímetro
- [[modulos/calibration-records]] — formato dual de observacoes
- [[modulos/calibration-certificate-parsers]] — parser local de Paquímetro
```

- [ ] **Step 3: Criar docs/dominio/campo-slugs.md**

```markdown
---
tags: [dominio, campos]
---

# Campo Slugs

## Como um slug é derivado

```ts
slug = serializeMeasurementFieldSlug({ name, groupName, subgroupName })
// Implementação em lib/measurement-fields.ts:108
```

Algoritmo:
1. Concatena `[groupName, subgroupName, name]` filtrando vazios
2. Remove acentos (NFD + strip combining marks)
3. Lowercase
4. Substitui não-alfanuméricos por `-`
5. Remove `-` inicial e final

Exemplo:
- `name="Maior erro externo"`, sem grupo → slug: `maior-erro-externo`
- `name="Erro"`, `groupName="Externo"` → slug: `externo-erro`

## Por que não mudar slug independentemente

O slug é a chave que liga:
- Template da categoria (`categoria_campos_medicao`)
- Campos do instrumento (`instrumento_campos_medicao`)
- Entradas de calibração em `observacoes` (`fieldSlug`)
- Regras de derivação em `calibration-derivations.ts` (os `targetSlug` e `sourceSlugs`)

Alterar `name`, `groupName` ou `subgroupName` sem atualizar todos os registros históricos quebra a leitura do histórico.

## Onde slugs são usados

| Local | Uso |
|-------|-----|
| `calibration-derivations.ts` | `targetSlug` e `sourceSlugs` das regras de Paquímetro |
| `calibration-extraction.ts` | Schema JSON enviado para a IA (`enum` de slugs válidos) |
| `calibration-records.ts` | `fieldSlug` dentro do payload de observacoes |
| `calibration-certificate-parsers.ts` | Mapeamento de overrides por slug |

## Relacionado
- [[modulos/measurement-fields]] — função `serializeMeasurementFieldSlug`
- [[modulos/calibration-derivations]] — regras que dependem de slugs exatos
- [[dominio/regras-criticas]] — regra #7
```

- [ ] **Step 4: Commit**

```bash
git add docs/dominio/
git commit -m "docs: add domain model, critical rules and slug docs"
```

---

### Task 4: Criar docs de módulos — calibração core

**Files:**
- Create: `docs/modulos/calibration-records.md`
- Create: `docs/modulos/calibration-derivations.md`
- Create: `docs/modulos/calibration-certificates.md`
- Create: `docs/modulos/calibration-certificate-parsers.md`

- [ ] **Step 1: Criar docs/modulos/calibration-records.md**

```markdown
---
tags: [modulo, lib, calibracao]
arquivo: lib/calibration-records.ts
---

# calibration-records

**Arquivo:** `lib/calibration-records.ts`
**Responsabilidade:** serialização e parse do payload estruturado dentro de `calibracoes.observacoes`

## O que faz

Gerencia o formato dual de `observacoes`: o campo pode ser texto puro ou pode conter um bloco JSON estruturado entre marcadores. Este módulo é o único ponto de leitura/escrita desse formato.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `serializeCalibrationRecord` | ~74 | Serializa `{ notes, fields[] }` para string de observacoes com bloco JSON |
| `parseCalibrationRecord` | ~103 | Faz parse da string de observacoes; retorna `{ notes, fields[] }` |

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `CalibrationStoredFieldEntry` | Uma entrada de campo: `fieldId`, `fieldSlug`, `value`, `unit`, `status`, `confidence`, `evidence` |
| `CalibrationFieldReviewStatus` | `"unknown" \| "conforming" \| "non_conforming"` |

## Contexto de criação

Criado para armazenar dados estruturados de calibração sem alterar o schema do banco. O campo `observacoes` existia como texto; o sistema passou a embutir JSON dentro de marcadores para manter compatibilidade.

## Regras críticas

- **Nunca** tratar `observacoes` como texto puro sem passar por `parseCalibrationRecord` — o bloco JSON pode estar lá
- `serializeCalibrationRecord` descarta campos com `value`, `unit`, `evidence` vazios e `confidence` null e `status` unknown — isso é intencional
- Os marcadores são literais: `[[METROLOGIA_CALIBRATION_DATA]]` e `[[/METROLOGIA_CALIBRATION_DATA]]`

## Relacionado

- [[dominio/modelo]] — onde observacoes vive no modelo de dados
- [[dominio/regras-criticas]] — regra #6 (formato dual)
- [[arquitetura/data-layer]] — formato dual explicado
- [[modulos/calibrations]] — usa `parseCalibrationRecord` ao mapear histórico
- [[componentes/calibration-create-flow]] — usa `serializeCalibrationRecord` ao salvar

## Código-fonte
[[lib/calibration-records.ts]]
```

- [ ] **Step 2: Criar docs/modulos/calibration-derivations.md**

```markdown
---
tags: [modulo, lib, paquimetro]
arquivo: lib/calibration-derivations.ts
---

# calibration-derivations

**Arquivo:** `lib/calibration-derivations.ts`
**Responsabilidade:** cálculo automático de campos derivados por categoria (hoje só Paquímetro)

## O que faz

Aplica regras de derivação sobre um array de campos de calibração. Para Paquímetro, calcula automaticamente os campos "Incerteza + maior Erro" somando os pares de campos-fonte.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `isAutoCalculatedCalibrationField` | ~120 | Retorna `true` se o `fieldSlug` é calculado automaticamente para a categoria |
| `applyCalibrationDerivedValues` | ~127 | Aplica regras de derivação e retorna o array de campos com valores calculados |

## Regras de Paquímetro (linhas 16–45)

| Campo derivado | Fontes |
|---------------|--------|
| `Incerteza + maior Erro externo` | `Maior erro externo` + `Incerteza de medicao externo` |
| `Incerteza + maior Erro interno` | `Incerteza de medicao interno` + `Maior erro interno` |
| `Incerteza + maior Erro profundidade` | `Maior erro profundidade` + `Incerteza de medicao profundidade` |
| `Incerteza + maior Erro ressalto` | `Maior erro ressalto` + `Incerteza de medicao ressalto` |

A detecção de Paquímetro é por `isPaquimetroCategory` (linha ~58): normaliza o identificador e verifica se contém "paquimetro".

## Contexto de criação

Criado quando o time percebeu que certos campos do Paquímetro são sempre soma de outros dois. Automatizar evita erro humano e garante consistência. Isolado neste arquivo para não vazar regra de categoria em código genérico.

## Regras críticas

- Campos derivados têm `confidence: null` e `evidence: ""` — não vieram da IA
- Se um dos campos-fonte estiver vazio, o campo derivado fica vazio (não NaN)
- A soma usa o número de casas decimais do máximo entre os dois valores-fonte
- `isAutoCalculatedCalibrationField` é usado nos componentes para bloquear edição manual do campo derivado

## Relacionado

- [[dominio/regras-criticas]] — regra #3 e #4
- [[dominio/campo-slugs]] — slugs são a chave das regras de derivação
- [[modulos/measurement-fields]] — `serializeMeasurementFieldSlug` usada nas regras
- [[modulos/calibration-certificate-parsers]] — parser local complementar para Paquímetro
- [[componentes/calibration-create-flow]] — chama `applyCalibrationDerivedValues`

## Código-fonte
[[lib/calibration-derivations.ts]]
```

- [ ] **Step 3: Criar docs/modulos/calibration-certificates.md**

```markdown
---
tags: [modulo, lib, storage]
arquivo: lib/calibration-certificates.ts
---

# calibration-certificates

**Arquivo:** `lib/calibration-certificates.ts`
**Responsabilidade:** validação de arquivo PDF e geração de paths de storage no Supabase

## O que faz

Fornece funções para validar se um arquivo é PDF, construir o path de storage e extrair o path de uma URL pública do Supabase.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `isPdfCertificateFile` | ~28 | Retorna `true` se o arquivo é PDF (por mimetype ou extensão) |
| `buildCalibrationCertificatePath` | ~35 | Gera path `{folder}/{tag}/{calibracao-id-timestamp-nome}.pdf` |
| `getCalibrationCertificateStoragePathFromUrl` | ~52 | Extrai o storage path de uma URL pública do Supabase |
| `sanitizeStoragePathSegment` | ~17 | Limpa um segmento de path (sem acentos, só alfanumérico e `-`) |

## Constantes

| Constante | Valor padrão |
|-----------|-------------|
| `CALIBRATION_CERTIFICATE_BUCKET` | `shiftapp-files` |
| `MAX_CALIBRATION_CERTIFICATE_FILE_SIZE` | `10 * 1024 * 1024` (10 MB) |

## Contexto de criação

Isolado para centralizar a lógica de storage de certificados. O path gerado inclui tag slugificada + timestamp para evitar colisões.

## Relacionado

- [[arquitetura/data-layer]] — bucket e pasta configuráveis por env
- [[api/calibracoes-extrair]] — valida PDF antes de enviar para IA
- [[componentes/calibration-create-flow]] — valida antes de submit

## Código-fonte
[[lib/calibration-certificates.ts]]
```

- [ ] **Step 4: Criar docs/modulos/calibration-certificate-parsers.md**

```markdown
---
tags: [modulo, lib, paquimetro, parser]
arquivo: lib/calibration-certificate-parsers.ts
---

# calibration-certificate-parsers

**Arquivo:** `lib/calibration-certificate-parsers.ts`
**Responsabilidade:** parser local de tabelas de certificados conhecidos (hoje só Paquímetro Metrus)

## O que faz

Lê as tabelas extraídas pelo `pdf-parse` de certificados de layout conhecido e gera overrides precisos para os campos de calibração, substituindo ou complementando o que a IA retornou.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `buildPaquimetroFieldOverridesFromTablePages` | ~218 | Se o certificado for Metrus Paquímetro, lê tabelas e retorna `CalibrationExtractionFieldOverride[]` |

## Como detecta o certificado Metrus Paquímetro

`isLikelyMetrusPaquimetroCertificate` (linha ~172) verifica:
- Categoria contém "paquimetro"
- Texto contém "metrus" e "for-0004-paq"
- `tablePages.length >= 2`, página 1 com ≥ 4 tabelas, página 2 com ≥ 2 tabelas

## Estrutura das seções

| Seção | Fonte |
|-------|-------|
| `externo` | Tabelas 0 e 1 da página 1 |
| `interno` | Tabelas 2 e 3 da página 1 |
| `ressalto` | Tabela 0 da página 2 |
| `profundidade` | Tabela 1 da página 2 |

Para cada seção extrai: `error` (maior magnitude), `u` (maior valor numérico).

## Contexto de criação

Criado porque o modelo de IA falha em ler tabelas numéricas de forma confiável em alguns certificados. O parser lê diretamente a estrutura de tabelas do `pdf-parse` com 100% de confiança.

## Regras críticas

- O parser só ativa se o certificado passar TODOS os critérios de `isLikelyMetrusPaquimetroCertificate`
- Campos derivados (`kind === "derived"`) são ignorados — calculados por `calibration-derivations.ts`
- `confidence: 1` nos overrides indica certeza total (leitura direta da tabela)

## Relacionado

- [[modulos/calibration-derivations]] — calcula campos derivados sobre os overrides
- [[modulos/calibration-extraction]] — chama este parser após normalização da IA
- [[api/calibracoes-extrair]] — aplica os overrides no pipeline
- [[dominio/regras-criticas]] — regra #4 (Paquímetro especial)

## Código-fonte
[[lib/calibration-certificate-parsers.ts]]
```

- [ ] **Step 5: Commit**

```bash
git add docs/modulos/calibration-records.md docs/modulos/calibration-derivations.md docs/modulos/calibration-certificates.md docs/modulos/calibration-certificate-parsers.md
git commit -m "docs: add module docs for calibration core (records, derivations, certificates, parsers)"
```

---

### Task 5: Criar docs de módulos — extração e histórico

**Files:**
- Create: `docs/modulos/calibration-extraction.md`
- Create: `docs/modulos/calibrations.md`
- Create: `docs/modulos/dashboard-metrics.md`

- [ ] **Step 1: Criar docs/modulos/calibration-extraction.md**

```markdown
---
tags: [modulo, lib, ia, extracao]
arquivo: lib/calibration-extraction.ts
---

# calibration-extraction

**Arquivo:** `lib/calibration-extraction.ts`
**Responsabilidade:** prompt, schema JSON e normalização da extração por IA

## O que faz

Constrói o prompt enviado ao modelo, o schema JSON que o modelo deve respeitar, prepara o texto do PDF e normaliza o retorno bruto da IA para o tipo `CalibrationExtractionResult`.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `buildCalibrationExtractionSchema` | ~99 | Gera schema JSON dinâmico com enum dos `fieldSlug` válidos |
| `buildCalibrationExtractionPrompt` | ~133 | Monta o prompt completo com campos, texto do PDF e tabelas |
| `prepareCalibrationExtractionDocumentText` | ~184 | Limpa e trunca o texto extraído do PDF |
| `formatTablePagesAsMarkdown` | ~211 | Converte `string[][][]` do pdf-parse em Markdown de tabelas |
| `normalizeCalibrationExtractionResult` | ~252 | Normaliza resposta bruta da IA para `CalibrationExtractionResult` |

## Constantes

| Constante | Valor |
|-----------|-------|
| `defaultCalibrationExtractionModel` | `nvidia/nemotron-nano-12b-v2-vl:free` (ou env) |
| `maxCalibrationExtractionDocumentTextLength` | `18_000` chars |

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `CalibrationExtractionHeader` | `responsible`, `calibrationDate`, `certificateDate`, `validityDate`, `observations` |
| `CalibrationExtractionFieldSuggestion` | Sugestão por campo com `value`, `unit`, `conforme`, `confidence`, `evidence` |
| `CalibrationExtractionResult` | `{ header, fields[], warnings[] }` |

## Regras críticas

- O prompt instrui o modelo a **não inventar** dados ausentes — usar `null`
- `hasDocumentContent` controla se o prompt instrui a usar texto ou o PDF anexo
- `formatTablePagesAsMarkdown` aplica budget: se tabelas + texto excedem `maxLength`, trunca com `[tabelas truncadas]`
- `normalizeCalibrationExtractionResult` filtra slugs inválidos e desduplicados

## Relacionado

- [[arquitetura/ia-pipeline]] — visão geral do pipeline
- [[api/calibracoes-extrair]] — usa todas as funções deste módulo
- [[modulos/calibration-certificate-parsers]] — overrides aplicados após normalização
- [[modulos/measurement-fields]] — `MeasurementFieldItem` usado no schema e no prompt

## Código-fonte
[[lib/calibration-extraction.ts]]
```

- [ ] **Step 2: Criar docs/modulos/calibrations.md**

```markdown
---
tags: [modulo, lib, historico]
arquivo: lib/calibrations.ts
---

# calibrations

**Arquivo:** `lib/calibrations.ts`
**Responsabilidade:** mapeamento do histórico de calibrações, filtros por período e derivação de status

## O que faz

Converte linhas brutas do banco (`CalibrationDbRow` + `CalibrationResultDbRow[]`) em `CalibrationHistoryItem` com datas formatadas, status derivado e campos estruturados. Fornece constantes e helpers para filtros de período.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `mapCalibrationHistoryRow` | ~273 | Mapeia row do banco para `CalibrationHistoryItem` |
| `getCalibrationFilterStartDate` | ~113 | Retorna data ISO de início do período (3m, 6m, 1y, 3y, 5y) |
| `isCalibrationFilterPreset` | ~105 | Type guard para `CalibrationFilterPreset` |
| `isCalibrationStatusValue` | ~109 | Type guard para `CalibrationStatusValue` |

## Constantes exportadas

| Constante | Descrição |
|-----------|-----------|
| `calibrationFilterOptions` | Array `[{ value, label }]` para os 5 presets de período |
| `calibrationStatusOptions` | Opções de status: Aprovado, Em revisao, Perto de vencer, Reprovado |

## Como status é derivado (função `deriveStatus`, linha ~205)

1. Se `status_geral` tem valor e tom reconhecível → usa o label explícito
2. Se há resultados com conformidade → `danger` (algum não conforme) ou `neutral` (todos conformes)
3. Se há `data_validade` → usa `getRelativeCalibration` de `lib/instruments.ts`
4. Fallback: `"Em revisão"` com tom `warning`

A função prefere resultados do payload de `observacoes` sobre `calibracao_resultados` quando ambos existem.

## Contexto de criação

Centraliza a lógica de "como uma linha do banco vira um item do histórico". Separa formatação de datas, derivação de status e leitura do payload estruturado em um único lugar testável.

## Relacionado

- [[modulos/calibration-records]] — `parseCalibrationRecord` chamado aqui
- [[modulos/instruments]] — `getRelativeCalibration` usado no deriveStatus
- [[componentes/calibration-create-flow]] — exibe o histórico
- [[api/calibracoes]] — retorna `CalibrationHistoryItem[]`

## Código-fonte
[[lib/calibrations.ts]]
```

- [ ] **Step 3: Criar docs/modulos/dashboard-metrics.md**

```markdown
---
tags: [modulo, lib, dashboard]
arquivo: lib/dashboard-metrics.ts
---

# dashboard-metrics

**Arquivo:** `lib/dashboard-metrics.ts`
**Responsabilidade:** agregações do dashboard (totais, alertas, breakdown por status)

## O que faz

Carrega dados do banco e calcula as métricas do dashboard: total de instrumentos, categorias, percentual em conformidade, alertas priorizados e breakdown por tom.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `getDashboardMetrics` | ~122 | Async: carrega dados do banco e retorna `DashboardMetrics` |
| `computeDashboardMetrics` | ~72 | Pura: calcula métricas a partir de rows já carregadas (testável) |

`getDashboardMetrics` chama `loadDashboardRows` (função interna, linha ~38) que usa `supabaseAdmin` com import dinâmico para compatibilidade com Vitest.

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `DashboardSummaryCard` | `{ title, value, note?, tone, href }` — card clicável do dashboard |
| `DashboardAlert` | `{ id, tag, title, note, badgeLabel, tone }` — alerta com link para instrumento |
| `DashboardBreakdownItem` | `{ label, count, tone }` — linha do donut chart |
| `DashboardMetrics` | Objeto completo com todos os agregados |

## Lógica de alertas

- Filtra instrumentos com `tone !== "neutral"`
- Ordena por prioridade: `danger` antes de `warning`, depois por `diffInDays` crescente
- Limita a 5 alertas no dashboard

## Relacionado

- [[modulos/instruments]] — `mapInstrumentRow` e `formatInstrumentAlertNote` usados aqui
- [[componentes/dashboard-content]] — consume `getDashboardMetrics`
- [[historico/specs/2026-04-21-b3-dashboard-navigation-design]] — spec que adicionou `id` e `href`

## Código-fonte
[[lib/dashboard-metrics.ts]]
```

- [ ] **Step 4: Commit**

```bash
git add docs/modulos/calibration-extraction.md docs/modulos/calibrations.md docs/modulos/dashboard-metrics.md
git commit -m "docs: add module docs for extraction, calibrations history and dashboard metrics"
```

---

### Task 6: Criar docs de módulos — instrumentos e medidas

**Files:**
- Create: `docs/modulos/instruments.md`
- Create: `docs/modulos/measurements.md`
- Create: `docs/modulos/measurement-fields.md`
- Create: `docs/modulos/categories.md`

- [ ] **Step 1: Criar docs/modulos/instruments.md**

```markdown
---
tags: [modulo, lib, instrumentos]
arquivo: lib/instruments.ts
---

# instruments

**Arquivo:** `lib/instruments.ts`
**Responsabilidade:** mapeamento de instrumentos, cálculo de prazo de calibração e tag de exibição

## O que faz

Converte rows do banco em `InstrumentItem` com tag exibível, fabricante, calibração formatada e tom de alerta. Também fornece funções para calcular o status relativo de prazo e mesclar campos com a última calibração.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `mapInstrumentRow` | ~219 | Converte `InstrumentDbRow` para `InstrumentItem` com tom calculado |
| `getRelativeCalibration` | ~127 | Retorna `{ tone, diffInDays, description }` para uma data ISO |
| `formatInstrumentCalibration` | ~174 | Retorna `{ calibration, tone, diffInDays }` com texto formatado |
| `formatInstrumentAlertNote` | ~200 | Gera texto de nota do alerta ("Vencido há X dias") |
| `buildInstrumentDisplayTag` | ~122 | Gera tag de exibição `PRE-001` a partir de categoria e id |
| `mergeInstrumentFieldsWithLatestCalibration` | ~246 | Mescla campos do instrumento com valores da última calibração |
| `serializeDate` | ~115 | Date → string ISO `YYYY-MM-DD` |

## Tons de alerta

| Tom | Condição |
|-----|----------|
| `"danger"` | `diffInDays < 0` (vencido) |
| `"warning"` | `diffInDays <= 30` (vence em até 30 dias) |
| `"neutral"` | `diffInDays > 30` ou sem prazo definido |

## Regras críticas

- `buildInstrumentDisplayTag` é fallback — só usado quando a `tag` salva no banco parecer UUID
- `getRelativeCalibration` compara datas por dia (ignora hora) usando `getStartOfDay`
- `mergeInstrumentFieldsWithLatestCalibration` resolve conflito por `fieldId` primeiro, depois por `fieldSlug`

## Relacionado

- [[modulos/calibrations]] — usa `getRelativeCalibration` no deriveStatus
- [[modulos/dashboard-metrics]] — usa `mapInstrumentRow` e `formatInstrumentAlertNote`
- [[modulos/measurement-fields]] — `MeasurementFieldItem` usado em `InstrumentDetailItem`

## Código-fonte
[[lib/instruments.ts]]
```

- [ ] **Step 2: Criar docs/modulos/measurements.md**

```markdown
---
tags: [modulo, lib, medidas]
arquivo: lib/measurements.ts
---

# measurements

**Arquivo:** `lib/measurements.ts`
**Responsabilidade:** normalização entre representação de UI e formato técnico do banco para unidades de medida

## O que faz

Converte entre o formato do banco (ex: `celsius`, `grau`, `pct`) e o formato de exibição (ex: `°C`, `°`, `%`). Também mapeia rows do banco para `MeasurementItem`.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `formatMeasurementType` | ~96 | `rawValue` (banco) → string de exibição na UI (`°C`, `mm²`, etc.) |
| `serializeMeasurementType` | ~137 | String da UI → formato do banco para salvar |
| `mapMeasurementRow` | ~173 | Converte `MeasurementRow` do banco para `MeasurementItem` |

## Mapeamentos especiais

- `celsius` ↔ `°C`, `fahrenheit` ↔ `°F`, `grau`/`graus` ↔ `°`
- `pct` ↔ `%`, `ohm` ↔ `Ω`, `um` ↔ `µm`
- `hz` ↔ `Hz`, `ph` ↔ `pH`, `db` ↔ `dB`
- Compostos: `mm_s` → `mm/s`, `mm2` → `mm²`, `shore_a` → `Shore A`

## Contexto de criação

O banco armazena tipos em formato normalizado (sem acentos, underscores). A UI exibe em formato técnico com símbolos Unicode. Este módulo é a ponte bidirecional.

## Relacionado

- [[modulos/measurement-fields]] — usa `formatMeasurementType` ao mapear campos
- [[api/calibracoes]] — usa `mapMeasurementRow` para retornar medidas

## Código-fonte
[[lib/measurements.ts]]
```

- [ ] **Step 3: Criar docs/modulos/measurement-fields.md**

```markdown
---
tags: [modulo, lib, campos]
arquivo: lib/measurement-fields.ts
---

# measurement-fields

**Arquivo:** `lib/measurement-fields.ts`
**Responsabilidade:** derivação de slug, agrupamento por grupo/subgrupo e mapeamento de campos de medição

## O que faz

Converte rows do banco de campos (de categoria ou de instrumento) para `MeasurementFieldItem`, deriva slugs, agrupa campos para renderização em layout hierárquico e serializa/parseia a configuração de tipo de valor.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `serializeMeasurementFieldSlug` | ~108 | Deriva slug de `{ name, groupName, subgroupName }` |
| `mapInstrumentMeasurementFieldRow` | ~325 | Row de `instrumento_campos_medicao` → `MeasurementFieldItem` |
| `mapCategoryMeasurementFieldRow` | ~332 | Row de `categoria_campos_medicao` → `MeasurementFieldItem` |
| `groupMeasurementFieldsByLayout` | ~242 | Agrupa fields em `Group > Subgroup > fields[]` ordenados |
| `sortMeasurementFields` | ~238 | Ordena por `order` e depois por `name` (pt-BR) |
| `hasMeasurementFieldGrouping` | ~318 | Retorna `true` se algum campo tem groupName ou subgroupName |
| `parseMeasurementFieldValueConfig` | ~117 | Parse do campo `tipo_valor` (JSON ou string legacy) |
| `serializeMeasurementFieldValueConfig` | ~161 | Serializa configuração para salvar no banco |

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `MeasurementFieldItem` | Campo completo com `slug`, `name`, `groupName`, `subgroupName`, `hint`, etc. |
| `MeasurementFieldLayoutGroup` | Grupo com lista de subgrupos |
| `MeasurementFieldLayoutSubgroup` | Subgrupo com lista de campos |

## Contexto de criação

Centraliza toda a lógica de campos de medição. O `tipo_valor` do banco é um JSON `{ type, groupName, subgroupName }` — este módulo faz o parse e a serialização. O agrupamento hierárquico é necessário para renderizar categorias complexas como Paquímetro.

## Regras críticas

- Slug é derivado de `[groupName, subgroupName, name]` concatenados (ver [[dominio/campo-slugs]])
- `tipo_valor` legacy (plain string) é tratado como `type` sem grupo
- `hint` (campo `dica_extracao`) é opcional; presente apenas em campos de categoria

## Relacionado

- [[dominio/campo-slugs]] — explicação detalhada da derivação de slugs
- [[modulos/calibration-derivations]] — usa `serializeMeasurementFieldSlug` nas regras
- [[modulos/measurements]] — `formatMeasurementType` usada internamente

## Código-fonte
[[lib/measurement-fields.ts]]
```

- [ ] **Step 4: Criar docs/modulos/categories.md**

```markdown
---
tags: [modulo, lib, categorias]
arquivo: lib/categories.ts
---

# categories

**Arquivo:** `lib/categories.ts`
**Responsabilidade:** mapeamento de categorias do banco para `CategoryItem` e serialização de slug

## O que faz

Converte `CategoryRow` do banco para `CategoryItem` com campos de medição e fornece a função de serialização de slug de categoria.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `mapCategoryRow` | ~30 | Converte `CategoryRow` + `MeasurementFieldItem[]` para `CategoryItem` |
| `serializeCategorySlug` | ~21 | Nome da categoria → slug (lowercase, sem acentos, `-` entre palavras) |

## Tipos exportados

| Tipo | Descrição |
|------|-----------|
| `CategoryItem` | `{ id (slug), dbId, name, slug, fields[] }` |
| `CategoryRow` | Row bruta do banco: `{ id, nome, slug }` |

## Relacionado

- [[dominio/modelo]] — categoria como raiz da hierarquia
- [[modulos/measurement-fields]] — `MeasurementFieldItem` usado nos fields da categoria
- [[api/categorias]] — retorna `CategoryItem[]`

## Código-fonte
[[lib/categories.ts]]
```

- [ ] **Step 5: Commit**

```bash
git add docs/modulos/instruments.md docs/modulos/measurements.md docs/modulos/measurement-fields.md docs/modulos/categories.md
git commit -m "docs: add module docs for instruments, measurements, fields and categories"
```

---

### Task 7: Criar docs de componentes

**Files:**
- Create: `docs/componentes/instrument-create-flow.md`
- Create: `docs/componentes/calibration-create-flow.md`
- Create: `docs/componentes/dashboard-content.md`
- Create: `docs/componentes/instruments-content.md`

- [ ] **Step 1: Criar docs/componentes/instrument-create-flow.md**

```markdown
---
tags: [componente, ui, instrumentos]
arquivo: app/_components/instrument-create-content.tsx
---

# instrument-create-flow

**Arquivo:** `app/_components/instrument-create-content.tsx`
**Tipo:** Client Component
**Responsabilidade:** orquestra o fluxo de 2 etapas para cadastrar novo instrumento com calibração inicial

## O que faz

Fluxo em 2 etapas:
1. **Dados do instrumento** — tag, categoria, fabricante
2. **Certificado e calibração inicial** — upload de PDF, extração por IA, revisão dos campos

## Fluxo principal

1. Carrega categorias e medidas via `GET /api/instrumentos/metadata`
2. Usuário escolhe categoria → UI exibe template de campos herdado
3. Usuário avança para etapa 2
4. Upload do PDF → validação imediata de tipo e tamanho
5. Botão "Extrair com IA" → chama `readExtractionSseStream` (SSE) → atualiza label por etapa
6. Usuário revisa campos (badges de confiança visíveis após extração)
7. Submit:
   - `POST /api/instrumentos` → cria instrumento
   - `POST /api/calibracoes` → cria calibração inicial
   - Se calibração falhar → rollback do instrumento

## Pontos de atenção

- Rollback manual: se `POST /api/calibracoes` falhar, o instrumento criado é deletado via `DELETE /api/instrumentos`
- A extração por IA usa SSE; o helper `lib/api/extract-sse.ts` abstrai o stream
- `showConfidenceIndicators` só ativa após extração rodar (passa para `CalibrationFieldReviewTable`)
- Campos derivados (`isAutoCalculatedCalibrationField`) são bloqueados para edição manual

## Relacionado

- [[api/instrumentos]] — `POST /api/instrumentos`
- [[api/calibracoes]] — `POST /api/calibracoes`
- [[api/calibracoes-extrair]] — extração via SSE
- [[modulos/calibration-derivations]] — `applyCalibrationDerivedValues`
- [[modulos/calibration-records]] — `serializeCalibrationRecord`

## Código-fonte
[[app/_components/instrument-create-content.tsx]]
```

- [ ] **Step 2: Criar docs/componentes/calibration-create-flow.md**

```markdown
---
tags: [componente, ui, calibracao]
arquivo: app/_components/instrument-calibration-create-content.tsx
---

# calibration-create-flow

**Arquivo:** `app/_components/instrument-calibration-create-content.tsx`
**Tipo:** Client Component
**Responsabilidade:** formulário de nova calibração para instrumento existente

## O que faz

Renderiza o formulário de nova calibração: upload de PDF no topo, campos de data, tabela de campos de medição com revisão, extração opcional por IA.

## Fluxo principal

1. Carrega instrumento via `GET /api/instrumentos?id=<id>`
2. Monta tabela com os campos do instrumento
3. PDF sobe primeiro (topo do formulário) — validação imediata de tipo (`.pdf`) e tamanho (≤ 10 MB)
4. Botão "Extrair com IA" (opcional) → SSE → label do botão muda por etapa
5. Aplica `applyCalibrationDerivedValues` após extração
6. Validação inline por campo antes do submit (sem erro genérico)
7. `POST /api/calibracoes` → salva
8. Atualiza `data_ultima_calibracao` e `proxima_calibracao` no instrumento

## Estado relevante

| Estado | O que controla |
|--------|---------------|
| `pdfFile` | Arquivo PDF selecionado |
| `extractionMessage` | Mensagem da etapa atual do SSE |
| `showConfidenceIndicators` | Ativa badges de confiança após extração |
| `validationErrors` | Mapa de erros por campo |

## Pontos de atenção

- `handleExtractWithAi` usa AbortController com timeout de 75s — se ultrapassar, exibe mensagem diferenciada
- `validationErrors.form` é reservado para falhas de servidor (API/rede) — erros inline por campo são suficientes para validação local
- PDF sobe ao topo do formulário (primeira seção visível) — deliberado para forçar upload antes de preencher campos

## Relacionado

- [[api/calibracoes-extrair]] — extração via SSE
- [[api/calibracoes]] — `POST /api/calibracoes`
- [[modulos/calibration-derivations]] — `applyCalibrationDerivedValues`
- [[modulos/calibration-records]] — `serializeCalibrationRecord`
- [[modulos/calibration-certificates]] — `isPdfCertificateFile`, `MAX_CALIBRATION_CERTIFICATE_FILE_SIZE`

## Código-fonte
[[app/_components/instrument-calibration-create-content.tsx]]
```

- [ ] **Step 3: Criar docs/componentes/dashboard-content.md**

```markdown
---
tags: [componente, ui, dashboard]
arquivo: app/_components/dashboard-content.tsx
---

# dashboard-content

**Arquivo:** `app/_components/dashboard-content.tsx`
**Tipo:** Server Component (RSC)
**Responsabilidade:** renderiza o dashboard com métricas navegáveis

## O que faz

Carrega `DashboardMetrics` via `getDashboardMetrics()` (server-side) e renderiza:
- Cards de resumo clicáveis (Total instrumentos → `/instrumentos`, Categorias → `/categorias`)
- Lista de alertas clicáveis (cada alerta → `/instrumentos/{id}`)
- Donut chart com legenda clicável (cada linha → `/instrumentos?status={tone}`)

## Mapeamento de tons para status de filtro

| `item.tone` do dashboard | `?status=` na URL |
|--------------------------|-------------------|
| `"ok"` | `neutral` |
| `"warning"` | `warning` |
| `"danger"` | `danger` |

Este mapeamento existe porque `DashboardBreakdownItem` usa `"ok"` enquanto o filtro de instrumentos usa `"neutral"`.

## Pontos de atenção

- É RSC — não usar hooks de cliente aqui
- `breakdownToneToStatus` está em escopo de módulo (não dentro do componente) para evitar recriação
- Links são `next/link` com `<Link>` — não `<a>`

## Relacionado

- [[modulos/dashboard-metrics]] — fonte dos dados
- [[componentes/instruments-content]] — destino dos links de status
- [[historico/specs/2026-04-21-b3-dashboard-navigation-design]] — spec original dos links

## Código-fonte
[[app/_components/dashboard-content.tsx]]
```

- [ ] **Step 4: Criar docs/componentes/instruments-content.md**

```markdown
---
tags: [componente, ui, instrumentos]
arquivo: app/_components/instruments-content.tsx
---

# instruments-content

**Arquivo:** `app/_components/instruments-content.tsx`
**Tipo:** Client Component
**Responsabilidade:** lista de instrumentos com filtros de status e busca

## O que faz

Renderiza a lista de instrumentos com:
- Filtro por status de calibração (`all`, `neutral`, `warning`, `danger`)
- Busca por texto
- Modal de edição/criação rápida (legado — sem calibração inicial)
- Inicialização do filtro via `?status=` URL param

## Estado relevante

| Estado | O que controla |
|--------|---------------|
| `calibrationFilter` | Filtro ativo (`all` \| `neutral` \| `warning` \| `danger`) |
| `searchQuery` | Texto de busca |

## Inicialização via URL

```ts
const searchParams = useSearchParams();
const initialStatus = searchParams.get("status");
// validStatuses = ["neutral", "warning", "danger"]
// Se status válido → usa como filtro inicial; senão → "all"
```

A constante `VALID_CALIBRATION_FILTER_STATUSES` está em escopo de módulo.

## Pontos de atenção

- `useSearchParams` exige `<Suspense>` no page pai (`app/instrumentos/page.tsx`) — obrigatório para build estático do Next.js
- O modal de criação rápida nesta tela não suporta calibração inicial — para isso usar `/instrumentos/novo`
- `calibrationFilter` não persiste na URL ao mudar manualmente (só inicializa por URL)

## Relacionado

- [[componentes/dashboard-content]] — origem dos links `?status=`
- [[historico/specs/2026-04-21-b3-dashboard-navigation-design]] — spec que adicionou inicialização por URL

## Código-fonte
[[app/_components/instruments-content.tsx]]
```

- [ ] **Step 5: Commit**

```bash
git add docs/componentes/
git commit -m "docs: add component docs for instrument create, calibration create, dashboard and instruments list"
```

---

### Task 8: Criar docs de API routes

**Files:**
- Create: `docs/api/calibracoes-extrair.md`
- Create: `docs/api/calibracoes.md`
- Create: `docs/api/instrumentos.md`
- Create: `docs/api/categorias.md`

- [ ] **Step 1: Criar docs/api/calibracoes-extrair.md**

```markdown
---
tags: [api, endpoint, ia, extracao]
arquivo: app/api/calibracoes/extrair/route.ts
---

# POST /api/calibracoes/extrair

**Arquivo:** `app/api/calibracoes/extrair/route.ts`
**Método:** POST
**Auth:** requer sessão via middleware
**Resposta:** SSE (`text/event-stream`) — exceto erros 4xx que retornam JSON

## O que faz

Endpoint principal do pipeline de extração por IA. Recebe PDF + id do instrumento, extrai campos do certificado com OpenRouter e retorna os resultados via SSE.

## Parâmetros (multipart/form-data)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `file` | File (PDF) | sim | Certificado em PDF |
| `instrumentId` | string | sim | ID do instrumento |
| `apiKey` | string | sim | API key do OpenRouter |

## Eventos SSE

| Evento | Payload |
|--------|---------|
| `data: {"type":"status","step":"reading_pdf"}` | Lendo PDF |
| `data: {"type":"status","step":"calling_ai"}` | Chamando modelo |
| `data: {"type":"status","step":"processing"}` | Normalizando resultado |
| `data: {"type":"result","data":{...}}` | `CalibrationExtractionResult` |
| `data: {"type":"error","message":"..."}` | Mensagem de erro |

## Pontos de atenção

- Timeout menor para modelos `:free` — enviado via AbortController
- Fallback automático de modelo via `OPENROUTER_FALLBACK_MODEL` em AbortError ou status 503
- Campos derivados NÃO são calculados aqui — calculados no cliente após receber o resultado
- O endpoint emite log estruturado no console após cada tentativa

## Relacionado

- [[modulos/calibration-extraction]] — `buildCalibrationExtractionPrompt`, `normalizeCalibrationExtractionResult`
- [[modulos/calibration-certificate-parsers]] — overrides locais aplicados aqui
- [[arquitetura/ia-pipeline]] — visão geral do pipeline
- [[componentes/calibration-create-flow]] — consumidor do SSE
- [[componentes/instrument-create-flow]] — consumidor do SSE

## Código-fonte
[[app/api/calibracoes/extrair/route.ts]]
```

- [ ] **Step 2: Criar docs/api/calibracoes.md**

```markdown
---
tags: [api, endpoint, calibracao]
arquivo: app/api/calibracoes/route.ts
---

# /api/calibracoes

**Arquivo:** `app/api/calibracoes/route.ts`
**Métodos:** GET, POST
**Auth:** requer sessão via middleware

## GET /api/calibracoes

Retorna histórico de calibrações de um instrumento.

**Query params:**

| Param | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `instrumentId` | number | sim | ID do instrumento |
| `period` | `3m\|6m\|1y\|3y\|5y` | não | Preset de período |
| `dateFrom` | `YYYY-MM-DD` | não | Data início (alternativa ao period) |
| `dateTo` | `YYYY-MM-DD` | não | Data fim (alternativa ao period) |

Retorna `CalibrationHistoryItem[]`.

## POST /api/calibracoes

Cria nova calibração.

**Body (JSON):**

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `instrumentId` | sim | ID do instrumento |
| `calibrationDate` | sim | Data da calibração (ISO) |
| `certificateUrl` | sim | URL do PDF já enviado para Storage |
| `fields` | não | Array de campos com valores |
| `notes` | não | Observações livres |

Após salvar: atualiza `data_ultima_calibracao` e `proxima_calibracao` no instrumento.

## Relacionado

- [[modulos/calibrations]] — `mapCalibrationHistoryRow`
- [[modulos/calibration-records]] — `serializeCalibrationRecord` usado no POST
- [[componentes/calibration-create-flow]] — chama POST
- [[componentes/instrument-create-flow]] — chama POST

## Código-fonte
[[app/api/calibracoes/route.ts]]
```

- [ ] **Step 3: Criar docs/api/instrumentos.md**

```markdown
---
tags: [api, endpoint, instrumentos]
arquivo: app/api/instrumentos/route.ts
---

# /api/instrumentos

**Arquivo:** `app/api/instrumentos/route.ts`
**Métodos:** GET, POST, PATCH, DELETE
**Auth:** requer sessão via middleware

## GET /api/instrumentos

Lista todos os instrumentos ou retorna um por id.

**Query params:**

| Param | Tipo | Descrição |
|-------|------|-----------|
| `id` | number | Retorna instrumento específico |

Sem `id`: retorna `InstrumentItem[]`.
Com `id`: retorna `InstrumentDetailItem` (com campos e última calibração).

## GET /api/instrumentos/metadata

Retorna `{ categories: CategoryItem[], measurements: MeasurementItem[] }` para alimentar o formulário de criação.

## POST /api/instrumentos

Cria instrumento. **Não cria calibração.** Quem orquestra instrumento + calibração é `/instrumentos/novo`.

## PATCH /api/instrumentos

Atualiza campos do instrumento (tag, fabricante, categoria, datas de calibração).

## DELETE /api/instrumentos

Deleta instrumento. Exige confirmação explícita na UI.

## Pontos de atenção

- `POST` aceita `fields` mas o frontend normalmente parte do template da categoria
- `laboratory` e `certificate` são aceitos no body mas não expostos na UI atual

## Relacionado

- [[modulos/instruments]] — `mapInstrumentRow`, `mergeInstrumentFieldsWithLatestCalibration`
- [[modulos/measurement-fields]] — campos do instrumento
- [[componentes/instrument-create-flow]] — chama POST + rollback em falha

## Código-fonte
[[app/api/instrumentos/route.ts]]
```

- [ ] **Step 4: Criar docs/api/categorias.md**

```markdown
---
tags: [api, endpoint, categorias]
arquivo: app/api/categorias/route.ts
---

# /api/categorias

**Arquivo:** `app/api/categorias/route.ts`
**Métodos:** GET, POST, PATCH, DELETE
**Auth:** requer sessão via middleware

## GET /api/categorias

Retorna `CategoryItem[]` com todos os campos de cada categoria.

## POST /api/categorias

Cria categoria com nome e campos opcionais.

## PATCH /api/categorias

Atualiza categoria e sincroniza campos para todos os instrumentos vinculados.

## DELETE /api/categorias

Deleta categoria. **Falha** se houver instrumentos vinculados (retorna erro 409).

## Pontos de atenção

- O PATCH sincroniza campos dos instrumentos — operação pesada em categorias com muitos instrumentos
- DELETE retorna 409 Conflict quando há instrumentos vinculados; a UI deve exibir mensagem clara

## Relacionado

- [[modulos/categories]] — `mapCategoryRow`, `serializeCategorySlug`
- [[modulos/measurement-fields]] — campos do template da categoria
- [[dominio/regras-criticas]] — regra #5 (categoria não deletável com instrumentos)

## Código-fonte
[[app/api/categorias/route.ts]]
```

- [ ] **Step 5: Commit**

```bash
git add docs/api/
git commit -m "docs: add API route docs for calibracoes, instrumentos and categorias"
```

---

### Task 9: Atualizar CLAUDE.md e README.md

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Atualizar paths no bloco "AI Agent Workflow" do CLAUDE.md**

No `CLAUDE.md`, encontrar o bloco:

```markdown
## AI Agent Workflow (Obsidian Integration)
When executing tasks, follow this autonomous workflow:
1. **Start:** Always read `HANDOFF_IA.md` first to understand the current project state and where we stopped.
2. **Context:** For business scope and rules, read `PRD_Metrologia.md` and `CONTEXT.md`.
3. **Execution:** Write code following the Architecture rules below. If writing tests, read `TDD.md` first.
4. **Finish:** After completing a task or before ending the session:
   - Append a summary of what was done to `LOGS.md`.
   - Update `HANDOFF_IA.md` with the new current state and next immediate steps.
```

Substituir por:

```markdown
## AI Agent Workflow (Obsidian Integration)
When executing tasks, follow this autonomous workflow:
1. **Start:** Always read `docs/estado/HANDOFF_IA.md` first to understand the current project state and where we stopped.
2. **Context:** For business scope and rules, read `docs/produto/PRD.md`. For code navigation, read `docs/00-INDEX.md`.
3. **Execution:** Write code following the Architecture rules below. If writing tests, read `docs/testes/TDD.md` first.
4. **Finish:** After completing a task or before ending the session:
   - Append a summary of what was done to `docs/estado/LOGS.md`.
   - Update `docs/estado/HANDOFF_IA.md` with the new current state and next immediate steps.
```

- [ ] **Step 2: Verificar se CLAUDE.md referencia CONTEXT.md em algum outro lugar**

```bash
grep -n "CONTEXT.md\|HANDOFF_IA.md\|PRD_Metrologia\|TDD.md\|LOGS.md" CLAUDE.md
```

Se houver outras ocorrências além das que já foram atualizadas, substituí-las pelos novos paths correspondentes.

- [ ] **Step 3: Atualizar README.md para versão thin**

Substituir o conteúdo do `README.md` por:

```markdown
# Metrologia PRO

Sistema web interno para controle de instrumentos, templates de calibração por categoria, prazos de vencimento, histórico técnico de certificados e extração assistida por IA a partir de PDFs.

## Stack

- Next.js 15 App Router + React 19 + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- OpenRouter (extração por IA)
- Vitest

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

## Variáveis de ambiente obrigatórias

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
OPENROUTER_API_KEY=""
```

## Comandos

```bash
npm run build          # build de produção
npm run test           # suite completa (Vitest)
npm run test:tdd       # watch mode TDD
npm run test:coverage  # cobertura
npm run test:ci        # test + build
```

## Documentação

Para entender o sistema antes de tocar no código, leia `docs/00-INDEX.md`.

- `docs/estado/HANDOFF_IA.md` — estado atual e próximos passos
- `docs/produto/PRD.md` — escopo e requisitos
- `docs/arquitetura/` — stack, banco, pipeline de IA
- `docs/modulos/` — um doc por arquivo `lib/`
- `docs/componentes/` — fluxos de UI
- `docs/api/` — endpoints
```

- [ ] **Step 4: Commit final**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update CLAUDE.md paths and slim down README for wiki migration"
```
