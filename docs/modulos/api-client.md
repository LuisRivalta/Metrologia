---
tags: [modulo, lib, api, cliente]
arquivo: lib/api/client.ts
---

# api/client + api/extract-sse

Dois helpers de chamada HTTP usados por todos os componentes cliente.

---

## `lib/api/client.ts` — fetchApi

Wrapper sobre `fetch` que injeta automaticamente `Authorization: Bearer <token>` antes de cada requisição.

```ts
fetchApi(input, init?) → Promise<Response>
```

- Lê `session.access_token` via `supabaseBrowser.auth.getSession()`
- Se já houver header `authorization` no `init`, não sobrescreve
- `credentials: "same-origin"` por padrão

Todos os componentes cliente usam `fetchApi` em vez de `fetch` direto.

---

## `lib/api/extract-sse.ts` — readExtractionSseStream

Async generator que consome o stream SSE do endpoint de extração e emite eventos tipados.

```ts
readExtractionSseStream(body: ReadableStream) → AsyncGenerator<SseExtractionEvent>
```

### Tipos de evento

| Tipo | Campos |
|------|--------|
| `status` | `step`, `message` — etapa atual do pipeline |
| `result` | `data` — payload final com `CalibrationExtractionResult` |
| `error` | `message`, `status` — falha controlada |

### Implementação

- Buffer SSE correto: split em `\n\n`, campo `event:` + `data:` por bloco
- `reader.releaseLock()` garantido no `finally`
- Eventos malformados são ignorados silenciosamente

## Relacionado

- [[arquitetura/visao-geral]] — request path de autenticação
- [[api/calibracoes-extrair]] — endpoint que emite os eventos SSE
- [[componentes/instrument-create-flow]] — usa ambos
- [[componentes/calibration-create-flow]] — usa ambos

## Código-fonte
[[lib/api/client.ts]] · [[lib/api/extract-sse.ts]]
