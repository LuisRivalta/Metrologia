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
