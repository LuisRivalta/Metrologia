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
