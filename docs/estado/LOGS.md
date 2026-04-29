# Logs do Projeto

## 2026-04-29 - UX: Modal de Categorias Mais Compacto

Removido do modal de edicao/criacao de categorias o texto "Template de calibracao da categoria" e a descricao "Esses itens vao aparecer automaticamente quando um instrumento dessa categoria for criado.".

**Arquivos modificados:** `app/_components/categories-content.tsx`, `app/globals.css`

**Resultado:** o cabecalho do builder de template foi removido e o botao "Novo campo" ficou na mesma linha do campo "Nome da categoria". Build de producao executado com sucesso.

**Complemento:** ao salvar uma categoria em edicao, a tela agora preserva o scroll da pagina e o scroll interno da tabela de categorias, evitando voltar para o topo apos o recarregamento da lista.

**Complemento 2:** o modal de edicao/criacao rapida de instrumentos agora explicita o campo "Cod setor" e alimenta as opcoes tambem pelos metadados de instrumentos, alem do carregamento direto de setores.

**Complemento 3:** os modais principais de categorias, instrumentos, setores e medidas nao fecham mais ao clicar fora deles; fechamento continua disponivel pelo X e pelos botoes de acao do proprio modal.

**Complemento 4:** a tabela da tela de instrumentos recebeu layout proprio com distribuicao automatica por conteudo e largura fixa apenas para "Acoes", evitando corte do cabecalho sem deixar colunas artificialmente espacadas.

---

## 2026-04-28 — Testes: Expansão de cobertura de branches

Adicionados 16 testes novos cobrindo branches anteriormente não alcançados.

**Arquivos modificados:** `tests/lib/measurements.test.ts`, `tests/lib/instruments.test.ts`, `tests/lib/calibration-records.test.ts`, `tests/lib/calibration-derivations.test.ts`, `tests/lib/categories.test.ts`

**Resultado:** 85 → 101 testes passando; branches 71.77% → 75.9%; statements 89.55%.

**Commit:** `09e6912` — `tests: expand branch coverage across lib modules`

---

## 2026-04-28 — Feature: Filtros Persistentes via URL + Chips Visuais

Todos os 4 filtros da lista de instrumentos (`/instrumentos`) agora persistem na URL e chips visuais indicam filtros ativos.

**Commits entregues:**
- `44cbe56` — `feat: init category/manufacturer/setor filters from URL`
- `ba8324d` — `feat: sync all 4 instrument filters to URL on change`
- `9227aee` — `feat: add active filter chips with URL sync to instruments list`
- `4236012` — `refactor: move syncFiltersToURL before activeChips useMemo`

**Mudanças em `app/_components/instruments-content.tsx`:**
1. `initialCategory`, `initialManufacturer`, `initialSetor` lidos do `searchParams` no mount (replicando o padrão já existente de `initialStatus`)
2. `syncFiltersToURL(filters)` — helper dentro do componente que constrói `URLSearchParams` e chama `router.replace` com `scroll: false`; deleta params vazios, seta os preenchidos
3. Os 4 selects de filtro e o botão "Limpar filtros" chamam `syncFiltersToURL` após cada mudança de estado
4. `activeChips` useMemo: gera array de `{ key, label, onRemove }` para cada filtro ativo; label do setor resolvido via `formatSetorLabel`; chips renderizados em `.filter-chips` entre o painel de filtros e a tabela; botão "Limpar tudo" reseta os 4 filtros e a URL

**Mudanças em `app/globals.css`:**
- `.filter-chips`, `.filter-chip`, `.filter-chip button`, `.filter-chips__clear` — light mode (azul sutil) + dark theme via `html[data-theme="dark"]`

**Resultado:** 85 testes passando, build limpo, push feito para `main`.

---

## 2026-04-27 — Melhorias no Editor de Categorias

Aprimoramentos no editor de templates de calibração das categorias.

**Componentes alterados:**
- `app/_components/categories-content.tsx` — `defaultMeasurementId` por subgrupo (propaga medida para linhas novas e existentes); `copyFieldDraftSubgroup` (copia subgrupo inteiro com novas IDs); confirmação modal antes de remover grupo ou subgrupo; validação "mínimo 1 campo" removida (template pode ficar vazio)
- `app/api/categorias/route.ts` — remoção da validação "mínimo 1 campo" em `sanitizeMeasurementFields`
- `app/api/instrumentos/metadata/route.ts` — erro em `setorRowsResponse` não bloqueia mais o carregamento; retorna `[]` em caso de falha de permissão no schema `setores`
- `app/globals.css` — layout do editor de subgrupos em 2 colunas; `subgroup-header` com flex; `section-actions` para ações lado a lado; modal alargado para 1100px; responsivo ≤ 820px colapsa para 1 coluna

---

## 2026-04-27 — Otimização da Wiki Obsidian

Sincronização completa da documentação com o estado real do código:

- Criados: `docs/modulos/setores.md`, `docs/api/setores.md`, `docs/componentes/setores-content.md`
- Atualizados: `docs/00-INDEX.md` (setores + seção superpowers), `docs/arquitetura/visao-geral.md` (página setores), `docs/arquitetura/data-layer.md` (tabela setores), `docs/dominio/modelo.md` (campo setor_id), `docs/componentes/instruments-content.md` (linhas clicáveis, atalho calibração, filtro setor), `docs/componentes/dashboard-content.md` (botão "Registrar calibração"), `docs/produto/PRD.md` (frontmatter + setores), `docs/testes/TDD.md` (setores.test.ts), `docs/estado/HANDOFF_IA.md` (estado atual)
- Removidos: arquivos vazios/órfãos da raiz (`2026-04-25.md`, `METROLOGIA_CALIBRATION_DATA.md`, `Sem título.canvas`, `Sem título 1.canvas`)
- Obsidian: ignore list expandida, color groups adicionados ao graph por tags

---

## 2026-04-25 — UX: Linhas Clicáveis na Lista de Instrumentos

Linhas da tabela de instrumentos tornadas clicáveis em sua totalidade via `onClick` no `<tr>` + `router.push`. `stopPropagation` no link da tag e no wrapper das ações preserva o comportamento existente. CSS: `cursor: pointer` + hover sutil light/dark.

---

## 2026-04-25 — Feature B4: Atalhos de Registro de Calibração (Tasks 1–4)

### O que foi feito

Feature "B4: Atalhos de Registro de Calibração" implementada via Subagent-Driven Development (4 tasks, revisão spec + qualidade por task). Branch: `feat/b4-calibration-shortcuts`.

**Componentes entregues:**
- `app/globals.css` — grid do `.dashboard-alert-item` reestruturado para 2 colunas; novas classes `.dashboard-alert-item__main` e `.dashboard-alert-item__calibrate`; dark theme e responsivo atualizados; `.table-action` com `inline-flex`
- `app/_components/dashboard-content.tsx` — cards de alerta reestruturados: `<Link>` externo substituído por `<div>` + `__main` (link para detalhe) + `__calibrate` (link para calibração)
- `app/_components/instruments-content.tsx` — `<PageTransitionLink>` com ícone de documento+plus adicionado na coluna "Ações" de cada linha

**Resultado:** um único clique a partir do dashboard ou da lista de instrumentos inicia o registro de calibração, sem alterar o fluxo existente.

**Testes:** 85 passando, build limpo.

---

## 2026-04-23 — Feature Setor de Uso: Implementação Completa (Tasks 1–8)

### O que foi feito

Feature "Setor de Uso em Instrumentos" implementada integralmente via Subagent-Driven Development (8 tasks, 2 revisões por task).

**Componentes entregues:**
- `lib/setores.ts` + `tests/lib/setores.test.ts` — tipos e funções puras (TDD, 3 testes)
- `app/api/setores/route.ts` — CRUD completo para `calibracao.setores`
- DB migration (manual no Supabase): `CREATE TABLE calibracao.setores` + `ALTER TABLE calibracao.instrumentos ADD COLUMN setor_id`
- `lib/instruments.ts` — adicionado `setor_id` em `InstrumentDbRow`, `setor: SetorItem | null` em `InstrumentItem`, novo 3º parâmetro `setoresById` em `mapInstrumentRow`
- `app/api/instrumentos/route.ts` + `metadata/route.ts` — setores carregados em paralelo, incluídos em todos os endpoints
- `app/_components/setores-content.tsx` + `app/configuracoes/setores/page.tsx` — UI CRUD completa
- `app/_components/settings-home-content.tsx` — atalho para `/configuracoes/setores`
- `app/_components/instrument-create-content.tsx` — dropdown setor no formulário de criação
- `app/_components/instruments-content.tsx` — coluna setor, filtro por setor, campo setor no modal de edição

**Resultado:** 85 testes passando, build limpo, branch `feat/setor-instrumentos` pronta para merge.

---

## 2026-04-23 — Setor de Uso (Task 1 de 8): lib/setores.ts + Testes

### O que foi feito

Implementação TDD da biblioteca TypeScript pura `lib/setores.ts` e seus testes unitários. Esta é a Task 1 da feature plan "Setor de Uso em Instrumentos" — cria a base de tipos e funções de manipulação que serão usados em Tasks posteriores (API, migração SQL, UI).

**1 commit entregue:**
- `fa43b46` — `feat: add lib/setores with SetorRow, SetorItem, mapSetorRow, formatSetorLabel`

**Mudanças:**
1. `lib/setores.ts` — 2 tipos (`SetorRow` com optional `created_at`, `SetorItem` sem) e 2 funções puras:
   - `mapSetorRow()` — converte row do banco para `SetorItem`, trimando campos `codigo` e `nome`
   - `formatSetorLabel()` — formata exibição como "codigo – nome"
2. `tests/lib/setores.test.ts` — 3 testes cobrindo: mapeamento de row com espaços, formatação de label, e handling de `created_at` ausente

**Validação:**
- 3 testes passando
- Build `npm run build` limpo, sem erros TypeScript
- Branch: `feat/setor-instrumentos` pronto para próxima task

---

## 2026-04-22/23 — Wiki Obsidian: Reorganização da Documentação

### O que foi feito

Reorganização completa dos `.md` do projeto em estrutura wiki categorizada, com docs por módulo para navegação rápida por IA.

**9 commits entregues:**
- `chore` — reorganize docs into categorized wiki structure (Task 1)
- `docs` — add wiki index and architecture docs (Task 2)
- `42bcb4a` — add domain model, critical rules and slug docs (Task 3)
- `37128bb` — add module docs for calibration core (records, derivations, certificates, parsers) (Task 4)
- `f3a9700` — add module docs for extraction, calibrations history and dashboard metrics (Task 5)
- `5115654` — add module docs for instruments, measurements, fields and categories (Task 6)
- `23af41c` — add component docs for instrument create, calibration create, dashboard and instruments list (Task 7)
- `0db4c87` — add API route docs for calibracoes, instrumentos and categorias (Task 8)
- `4041e11` + `c246648` + `bfe7cf4` — CLAUDE.md paths, README thin, quality review fixes (Task 9)

**Mudanças:**
1. Estrutura `docs/` com 8 categorias: `estado/`, `produto/`, `arquitetura/`, `dominio/`, `modulos/`, `componentes/`, `api/`, `testes/`, `historico/`
2. `docs/00-INDEX.md` — hub central com links `[[...]]` para toda a documentação
3. 3 docs de arquitetura (`visao-geral`, `data-layer`, `ia-pipeline`)
4. 3 docs de domínio (`modelo`, `regras-criticas`, `campo-slugs`)
5. 11 docs de módulos `lib/` — cada um com tabela de funções, linha aproximada, tipos, regras e `[[link]]` para o arquivo de código
6. 4 docs de componentes complexos
7. 4 docs de API routes
8. `CLAUDE.md` atualizado com paths novos; `README.md` thin apontando para wiki
9. Arquivos movidos: `HANDOFF_IA.md`, `LOGS.md`, `PRD.md`, `TDD.md` → respectivas subpastas de `docs/`
10. `CONTEXT.md` deletado (conteúdo absorvido pelos docs de arquitetura e domínio)

**Correções de qualidade (code review):**
- `lib/api/fetch-api.ts` → `lib/api/client.ts` (arquivo correto) em CLAUDE.md e visao-geral.md
- `CalibrationStoredFieldEntry`: adicionados `fieldName` e `measurementName` faltantes no doc
- `calibrations.md`: corrigido consumer do histórico (não é `calibration-create-flow`)

**Testes:** sem alteração de código — suite intacta.

---

## 2026-04-21 — B3: Dashboard Navegável

### O que foi feito

Brainstorm → spec → plano → execução com subagentes para tornar o dashboard navegável.

**5 commits entregues:**
- `2cc8737` — `feat: add id to DashboardAlert and href to DashboardSummaryCard`
- `0dce8d6` — `feat: add navigation links to dashboard alerts, summary cards, and donut legend`
- `5396379` — `refactor: move breakdownToneToStatus to module scope`
- `4b2d15c` — `feat: initialize calibration filter from URL status param`
- `24c6c5c` — `refactor: add explicit Suspense fallback and hoist validStatuses to module scope`

**Mudanças:**
1. `DashboardAlert` ganhou `id: number`; `DashboardSummaryCard` ganhou `href: string` em `lib/dashboard-metrics.ts`
2. `app/_components/dashboard-content.tsx`: alertas → `<Link href="/instrumentos/[id]">`, cards de resumo → `<Link href={card.href}>`, linhas da legenda do donut → `<Link href="/instrumentos?status=<tone>">` com mapeamento `ok→neutral`
3. `app/_components/instruments-content.tsx`: `useSearchParams` lê `?status` e inicializa `calibrationFilter`; constante `VALID_CALIBRATION_FILTER_STATUSES` em escopo de módulo
4. `app/instrumentos/page.tsx`: `<Suspense fallback={null}>` adicionado (obrigatório para `useSearchParams` em build estático)

**Testes:** 82 passando. Build limpo.

**Documentos gerados:**
- `docs/superpowers/specs/2026-04-21-b3-dashboard-navigation-design.md`
- `docs/superpowers/plans/2026-04-21-b3-dashboard-navigation.md`

## 2026-04-21 — B1 (v2): SSE Streaming + Formatação de Tabelas PDF

### O que foi feito

Brainstorm → spec → plano → execução com 6 subagentes para melhorar qualidade e UX do pipeline de extração por IA.

**7 commits entregues:**
- `5e64ac6` — `feat: add formatTablePagesAsMarkdown to calibration-extraction`
- `e995970` — `feat: add tableMarkdown param to buildCalibrationExtractionPrompt`
- `89fde79` — `feat: convert extraction endpoint to SSE streaming`
- `75182d8` — `refactor: remove unnecessary captured* aliases in extraction route`
- `e5e5f74` — `feat: add SSE stream reader helper for extraction endpoint`
- `ce65460` — `feat: add SSE progress steps to calibration create form`
- `a84b647` — `feat: add SSE progress steps to instrument create form`

**Mudanças:**
1. `formatTablePagesAsMarkdown` em `lib/calibration-extraction.ts` — converte `string[][][]` do pdf-parse em Markdown estruturado (`| col |`, `| --- |`) com budget calculado pelo espaço restante após texto corrido; trunca com `[tabelas truncadas]`
2. `buildCalibrationExtractionPrompt` aceita `tableMarkdown?: string | null` — concatena com `documentText` dentro do mesmo bloco `"""`; `hasDocumentContent` controla a instrução ao modelo
3. Endpoint `POST /api/calibracoes/extrair` convertido para SSE (`ReadableStream`, `text/event-stream`); erros de validação ainda retornam JSON 4xx; eventos: `status` (reading_pdf → calling_ai → processing), `result`, `error`
4. `lib/api/extract-sse.ts` — async generator `readExtractionSseStream` com buffer SSE correto, `reader.releaseLock()` no `finally`
5. Ambos os formulários (`instrument-calibration-create-content.tsx`, `instrument-create-content.tsx`) atualizam label do botão por etapa durante extração

**Testes:** 81 passando. Build limpo.

**Documentos gerados:**
- `docs/superpowers/specs/2026-04-21-ai-pipeline-design.md`
- `docs/superpowers/plans/2026-04-21-ai-pipeline-b1.md`



## 2026-04-20 — B1: AI Pipeline — Confiabilidade e Visibilidade

### O que foi feito

Brainstorm → spec → plano → execução com subagentes para melhorar confiabilidade e visibilidade do pipeline de extração por IA.

**5 commits entregues:**
- `b666202` — `feat: add structured log after AI extraction attempt`
- `4246fd6` — `fix: use response.ok instead of hardcoded true in extraction log`
- `68f2992` — `feat: add model fallback on timeout or 503 in AI extraction`
- `b22d32e` — `feat: show confidence indicators in calibration field table after AI extraction`
- `e7354a3` — `fix: add confidence badge styles and guard auto-calculated fields`
- `0be6690` — `fix: compute fieldsFilled from parsed response in extraction log`

**Mudanças em `app/api/calibracoes/extrair/route.ts`:**
1. `logExtractionAttempt` emite JSON estruturado ao console após cada tentativa (event, model, attempt, status, ok, fields_filled, raw_response_snippet)
2. `runExtractionAttempt` closure encapsula chamada ao OpenRouter + retry json_schema→json_object + log
3. Fallback automático de modelo via `OPENROUTER_FALLBACK_MODEL` env var — acionado em AbortError (timeout) ou status 503

**Mudanças em `app/_components/calibration-field-review-table.tsx`:**
1. `renderConfidenceBadge` helper — badge "baixa confiança" (amarelo, confidence < 0.7) e "não encontrado" (cinza, value vazio + confidence null)
2. Prop `showConfidenceIndicators?: boolean` (default `false`) — badges só aparecem após extração rodar
3. Badges renderizados nos 4 caminhos: tabela plana (editável e estático) e layout agrupado (editável e estático)
4. Guard `!autoCalculated` nos ramos estáticos para evitar falso positivo

**Mudanças em `app/_components/instrument-calibration-create-content.tsx`:**
- `showConfidenceIndicators={!!extractionMessage}` passado para `CalibrationFieldReviewTable`

**Mudanças em `app/globals.css`:**
- Estilos para `.calibration-field-table__confidence`, `--low`, `--not-found`

**Documentos gerados:**
- `docs/superpowers/specs/2026-04-20-b1-ai-pipeline-design.md`
- `docs/superpowers/plans/2026-04-20-b1-ai-pipeline.md`

## 2026-04-20 — B2: Melhoria do Fluxo de Calibração (UX Inline Validation)

### O que foi feito

Brainstorm → spec → plano → execução com subagentes para melhorar o fluxo de nova calibração para usuários avançados.

**3 commits entregues:**
- `9c9f709` — `feat: validate PDF format and size immediately on file select`
- `cc73c3c` — `feat: move PDF upload section to top of calibration form`
- `0fbc704` — `feat: show inline field errors only, keep generic error for server failures`

**Mudanças em `app/_components/instrument-calibration-create-content.tsx`:**
1. PDF sobe para o topo do formulário — primeira seção visível, antes dos campos de data
2. Validação imediata no upload: tipo (`.pdf`) e tamanho (≤ 10 MB) validados no `onChange`, erro inline aparece sem esperar o submit
3. Erro genérico "Revise os campos..." removido do `validateForm` — erros inline por campo + scroll automático são suficientes; `validationErrors.form` preservado apenas para falhas de servidor (API/rede)

**Observação:** o commit `9c9f709` também incluiu melhoria extra em `handleExtractWithAi` (abort controller de 75s + mensagem de timeout diferenciada) que não constava no plano mas é tecnicamente correta.

**Documentos gerados:**
- `docs/superpowers/specs/2026-04-18-b2-calibration-flow-design.md`
- `docs/superpowers/plans/2026-04-18-b2-calibration-flow.md`

## 2026-04-18 — Saúde Técnica: Cobertura de Testes P0/P1/P2

### O que foi feito

Ciclo completo de brainstorm → spec → plano → execução com subagentes para cobrir os caminhos de negócio mais críticos do projeto.

**Cobertura antes → depois:**
- Statements: 71.6% → 87.15%
- Branches: 56.19% → 70.73%
- Functions: 76.82% → 94.07%
- Testes: 39 → 73

**Tasks executadas (TDD, sem mocks):**
1. `dashboard-metrics.ts` (era 0%) — extraída função pura `computeDashboardMetrics`; import dinâmico de supabaseAdmin para compatibilidade com Vitest; 5 testes cobrindo empty, percentual, ordenação de alertas, limite e breakdown.
2. `instruments.ts` — 7 testes cobrindo far-future em meses, null date, e 4 branches de `formatInstrumentAlertNote`.
3. `calibrations.ts` — 7 testes cobrindo todos os presets de filtro, validações de status, `deriveStatus` com validade vencida/próxima, resultados do banco quando observacoes não tem payload.
4. `calibration-certificates.ts` — 7 testes cobrindo `getCalibrationCertificateStoragePathFromUrl` e `isPdfCertificateFile`.
5. `measurement-fields.ts` — 4 testes via wrappers públicos `mapInstrumentMeasurementFieldRow` e `mapCategoryMeasurementFieldRow`, incluindo hint e slug derivado.
6. `measurements.ts` — 4 testes cobrindo HR genérico, compostos com db/ph/hz, ra/rz compostos e serialização com Unicode.

**Documentos gerados:**
- `docs/superpowers/specs/2026-04-18-technical-health-design.md`
- `docs/superpowers/plans/2026-04-18-technical-health.md`

## 2026-04-17 — Geração do CLAUDE.md

O arquivo `CLAUDE.md` foi gerado com sucesso nesta sessão. A IA leu e consolidou o conteúdo de `CONTEXT.md`, `HANDOFF_IA.md`, `PRD_Metrologia.md` e `TDD.md`, produzindo um guia operacional direto para futuras instâncias de Claude Code. O documento cobre os comandos de desenvolvimento e teste, o caminho completo de uma requisição (fetchApi → middleware → API route com supabaseAdmin), o modelo de domínio Categoria → Instrumento → Calibração, o formato dual de `observacoes` com payload JSON embutido, o pipeline de extração assistida por IA via OpenRouter, as regras derivadas exclusivas do `Paquímetro` e as convenções de slug de campo. A partir desta sessão, a IA compreende que cálculos de negócio pertencem ao código em `lib/`, que a IA de extração apenas sugere valores, e que alterar slug, `observacoes` ou a categoria `Paquímetro` exige atenção redobrada e cobertura de testes.

## 2026-04-17

### O que foi feito
- Reescrita da documentacao principal com base no codigo atual do projeto.
- Atualizados `README.md`, `CONTEXT.md`, `PRD_Metrologia.md` e `TDD.md`.
- Criado `HANDOFF_IA.md` para onboarding tecnico de outra IA.
- Consolidado no texto o fluxo real de autenticacao, APIs internas, storage e extracao por IA.
- Registradas as regras operacionais mais importantes do dominio e os pontos de atencao para futuras alteracoes.

### Escopo documentado
- arquitetura do app
- paginas e rotas principais
- endpoints internos
- schemas e tabelas usados
- fluxo de cadastro de instrumento
- fluxo de cadastro de calibracao
- extracao assistida por IA
- regras derivadas de `Paquimetro`
- estrategia de testes

### Validacao
- `npm run test`
- `npm run build`

## 2026-04-13

### O que foi feito
- Consolidado o fluxo de categorias com template de calibracao por categoria.
- Ajustado o cadastro de instrumento para 2 etapas:
  - dados do instrumento
  - certificado e calibracao inicial
- Criada e refinada a tela de nova calibracao para instrumentos existentes.
- Removidos `numero do certificado` e `laboratorio` dos formularios de calibracao.
- O log passou a usar o nome do PDF como identificacao principal da calibracao.
- Integrada extracao assistida por IA via `OpenRouter`.
- Ajustada a leitura de PDF para usar o caminho nativo do modelo em vez do parser que falhava.
- Adicionado timeout para modelos `:free` da OpenRouter, evitando espera longa na UI.
- Implementadas regras derivadas para a categoria `Paquimetro`.
- Estruturada uma rotina de TDD com cobertura e scripts dedicados.
- Executado um ciclo TDD real em `lib/calibrations.ts`.

### Alteracoes
- Atualizados `app/_components/instrument-create-content.tsx` e `app/_components/instrument-calibration-create-content.tsx`.
- Atualizado o log em `app/_components/instrument-calibrations-content.tsx`.
- Atualizada a rota de extracao em `app/api/calibracoes/extrair/route.ts`.
- Atualizada a serializacao do historico em `lib/calibrations.ts`.
- Criado o helper de regras derivadas em `lib/calibration-derivations.ts`.
- Atualizados os principais arquivos de documentacao.

### Problemas encontrados
- Parser `cloudflare-ai` da OpenRouter falhando com `Failed to parse ...`.
- Modelo `nvidia/nemotron-nano-12b-v2-vl:free` demorando demais com PDF em alguns cenarios.
- Campos derivados de paquimetro exigiam conta automatica, mas a regra ainda nao existia no sistema.
- Parte da documentacao estava desatualizada.

### Solucoes aplicadas
- Remocao do parser forcado de PDF e uso do caminho nativo do modelo.
- Inclusao de timeout no backend para extracao com modelos `:free`.
- Calculo automatico de campos derivados por categoria no proprio sistema.
- Reorganizacao da documentacao principal.

## 2026-04-07

### O que foi feito
- Refinada a tela de login com foco visual e organizacao do layout.
- Integrado o componente `LightPillar` como fundo visual da pagina de login.
- Integrado o componente `ShinyText` no titulo `Metrologia Pro`.
- Integrado o componente `BorderGlow` no card de login.
- Implementado feedback de validacao no login com shake no botao e mensagem inline.

### Observacoes
- Nao houve alteracao de banco nesta etapa.
- O foco ficou concentrado em experiencia de login e identidade visual.

## 2026-04-06

### O que foi feito
- Estruturado o dashboard inicial com dados reais.
- Integradas categorias, medidas e instrumentos reais ao sistema.
- Criada a pagina individual de detalhe por instrumento.
- Ajustadas rotas e mapeadores para trabalhar com o schema `calibracao`.

### Observacoes
- O projeto passou a usar a base real como fonte principal da aplicacao.
