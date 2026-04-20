# Logs do Projeto

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
