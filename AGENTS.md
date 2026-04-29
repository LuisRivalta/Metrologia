# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.
## AI Agent Workflow (Obsidian Integration)
When executing tasks, follow this autonomous workflow:
1. **Start:** Always read `docs/estado/HANDOFF_IA.md` first to understand the current project state and where we stopped.
2. **Context:** For business scope and rules, read `docs/produto/PRD.md`. For code navigation, read `docs/00-INDEX.md`.
3. **Execution:** Write code following the Architecture rules below. If writing tests, read `docs/testes/TDD.md` first.
4. **Finish:** After completing a task or before ending the session:
   - Append a summary of what was done to `docs/estado/LOGS.md`.
   - Update `docs/estado/HANDOFF_IA.md` with the new current state and next immediate steps.
## Commands

```bash
npm run dev          # start dev server (uses --use-system-ca, required for corporate certs)
npm run build        # production build — run after any change that touches real app flow
npm run lint         # ESLint via Next.js
npm run test         # run full test suite once (Vitest)
npm run test:tdd     # watch mode for red→green→refactor cycle
npm run test:coverage # coverage report for lib/**/*.ts
npm run test:ci      # test + build (use before merging)
```

Run a single test file:
```bash
npx vitest run tests/lib/calibration-derivations.test.ts
```

## Architecture

### Request path
- Pages call `lib/api/client.ts` (`fetchApi`), which injects `Authorization: Bearer <access_token>` from `supabaseBrowser`
- `middleware.ts` validates that token (or `metrologia-access-token` / `metrologia-refresh-token` cookies) before allowing access to protected pages and API routes
- API routes use `supabaseAdmin` (service role key) — never the browser client

### Data layer
- All business tables live in the **`calibracao`** Postgres schema — every query must call `.schema("calibracao")`
- `lib/supabase/admin.ts` exports the admin client; `lib/supabase/browser.ts` exports the browser client
- `lib/server/instrument-details.ts` contains server-side helpers used in RSC pages

### Domain model
```
Categoria  →  defines campo template (fields with slug, groupName, subgroupName)
     ↓
Instrumento  →  inherits fields via instrumento_campos_medicao
     ↓
Calibracao  →  header + PDF (required) + structured payload inside observacoes
     ↓
calibracao_resultados  →  per-field conformance (only when reviewed)
```

### `observacoes` dual format
`calibracoes.observacoes` is NOT always plain text. It may contain a structured JSON block:
```
[[METROLOGIA_CALIBRATION_DATA]]
{"version":1,"fields":[...]}
[[/METROLOGIA_CALIBRATION_DATA]]
optional free text
```
Always use `lib/calibration-records.ts` to read/write this field.

### Business logic lives in `lib/`
Do not add rules to components or API routes. The important files:

| File | Responsibility |
|---|---|
| `lib/calibration-derivations.ts` | Auto-calculated fields per category (e.g. Paquímetro) |
| `lib/calibration-records.ts` | Serialization of the structured payload in `observacoes` |
| `lib/calibration-extraction.ts` | AI extraction prompt, schema, and normalization |
| `lib/calibration-certificate-parsers.ts` | Local parsers for known certificate layouts |
| `lib/calibration-certificates.ts` | PDF validation and Supabase Storage paths |
| `lib/measurement-fields.ts` | Field slug derivation and group/subgroup layout |
| `lib/measurements.ts` | Unit-of-measure normalization and serialization |
| `lib/instruments.ts` | Deadline calculation, alert tone, tag fallback |
| `lib/calibrations.ts` | History filters and calibration status |
| `lib/categories.ts` | Category helpers |
| `lib/dashboard-metrics.ts` | Dashboard aggregations |

### AI extraction pipeline (`POST /api/calibracoes/extrair`)
1. Validate PDF + API key
2. Resolve instrument fields to build a dynamic JSON schema
3. Try `pdf-parse` for text/tables; if insufficient text, send PDF as `data:` URL
4. Call OpenRouter (`nvidia/nemotron-nano-12b-v2-vl:free` by default, override via `OPENROUTER_CALIBRATION_EXTRACTION_MODEL`)
5. Normalize response → apply local certificate parser overrides
6. **AI suggests only** — derived fields are always calculated in code, never by AI

### Paquímetro special rules
`Paquímetro` is the only category with custom local derivations. It is not a generic category. Rules are isolated in `lib/calibration-derivations.ts` and covered by tests. Always check this file before changing calibration flow.

### Field slugs
A field's `slug` is derived from `name + groupName + subgroupName`. Never change these independently — altering slug logic breaks the link between category templates and instrument fields on existing records.

## Testing conventions
- Tests live in `tests/lib/*.test.ts` — Vitest, node environment, `@` alias to project root
- Coverage is measured only for `lib/**/*.ts` (excludes `lib/api`, `lib/server`, `lib/supabase`)
- When changing serialization logic: test `calibration-records.ts`
- When changing derivations: test `calibration-derivations.ts`
- When fixing a business rule bug: add a test that reproduces the original failure first

## Key invariants
- PDF upload is mandatory for every calibration record
- Category cannot be deleted if instruments are linked to it
- Creating an instrument via `POST /api/instrumentos` does **not** create a calibration — that orchestration belongs to the UI at `/instrumentos/novo`
- `fabricante` is optional on instruments
- Sensitive deletions require explicit confirmation in the UI
