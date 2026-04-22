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
