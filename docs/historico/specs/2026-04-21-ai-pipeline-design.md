---
tags: [historico, spec, ia]
feature: B1 — Pipeline IA SSE Streaming
data: 2026-04-21
---
# B1 — Pipeline de IA: Streaming SSE + Formatação de Tabelas

**Data:** 2026-04-21  
**Status:** Aprovado

## Problema

O pipeline de extração por IA tem dois problemas independentes:

1. **Qualidade:** a LLM retorna `null` em campos que estão claramente no PDF. A causa principal é que o texto extraído pelo `pdf-parse` chega à LLM sem estrutura de tabela — colunas quebradas, linhas misturadas — e o modelo não consegue associar os valores aos slugs corretos.

2. **UX lenta:** o processo demora mais de 20s e não emite nenhum feedback visual. O usuário não sabe se a tela travou ou está processando.

## Objetivo

Corrigir os problemas não-LLM do pipeline para que, ao substituir o nemotron pelo Gemini 2.5 Flash, a melhoria de qualidade seja atribuível só ao modelo — não a artefatos do pipeline.

## Escopo

- **Inclui:** streaming SSE no endpoint de extração, formatação de tabelas PDF para Markdown, UI de progresso por etapa.
- **Não inclui:** troca de modelo LLM, mudança no schema de extração, mudança nas regras derivadas, novo parser local.

---

## Arquitetura

### Backend — Streaming SSE (`app/api/calibracoes/extrair/route.ts`)

O endpoint deixa de retornar `NextResponse.json()` e passa a retornar um `ReadableStream` com Content-Type `text/event-stream`. O pipeline interno permanece idêntico — apenas emite eventos SSE em pontos-chave.

**Formato de evento:**
```
event: <tipo>
data: <JSON>\n\n
```

**Tipos de evento:**

| Tipo | Quando emitido | Payload |
|------|---------------|---------|
| `status` | Início de cada etapa | `{ step: string, message: string }` |
| `result` | Extração concluída com sucesso | mesmo objeto JSON atual |
| `error` | Qualquer falha | `{ message: string, status: number }` |

**Etapas que emitem `status`:**

| `step` | Momento |
|--------|---------|
| `reading_pdf` | Após validar arquivo, antes do `pdf-parse` |
| `calling_ai` | Após preparar prompt, antes de chamar OpenRouter |
| `processing` | Ao receber resposta da LLM, antes de normalizar |

**Invariantes preservados:**
- O abort controller de timeout no OpenRouter continua funcionando.
- O fallback de modelo (timeout/503) continua funcionando.
- Os overrides locais do Paquímetro continuam sendo aplicados por último.
- Erros de validação (PDF ausente, instrumento não encontrado) emitem `event: error` e fecham o stream imediatamente.

### Backend — Formatação de tabelas (`lib/calibration-extraction.ts`)

Nova função pura exportada:

```ts
formatTablePagesAsMarkdown(tablePages: CalibrationCertificateTablePage[]): string
```

**Regras:**
- Filtra linhas onde todas as células são vazias.
- Usa a primeira linha de cada tabela como cabeçalho (separador `---`).
- Prefixo por tabela: `### Página N — Tabela M`.
- Retorna string vazia se não houver tabelas com conteúdo.

**Integração no prompt:**

Quando `tablePages` tem conteúdo, o bloco de texto enviado à LLM recebe uma seção adicional:

```
[texto corrido do certificado]

## Tabelas extraídas do PDF
### Página 1 — Tabela 1
| Col A | Col B | Col C |
|-------|-------|-------|
| ...   | ...   | ...   |
```

O texto total (texto corrido + tabelas Markdown) é truncado no limite de 18.000 chars definido em `maxCalibrationExtractionDocumentTextLength`. O texto corrido tem prioridade — tabelas são anexadas no que sobrar do limite.

**O que não muda:** `tablePages` continua sendo passado diretamente para o parser local do Paquímetro, sem Markdown.

### Frontend — UI de progresso

**Componentes afetados:**
- `app/_components/instrument-calibration-create-content.tsx`
- `app/_components/instrument-create-content.tsx`

**Novo estado local (por componente):**
```ts
extractionStep: "reading_pdf" | "calling_ai" | "processing" | null
```

**Mensagens por etapa (exibidas no botão "Extrair com IA"):**

| `step` | Texto exibido |
|--------|--------------|
| `reading_pdf` | "Lendo o certificado..." |
| `calling_ai` | "Enviando para a IA..." |
| `processing` | "Processando resposta..." |
| `null` | label padrão do botão |

**Leitura do stream:** `fetch` + `ReadableStream` + `TextDecoder`, sem biblioteca externa. A lógica de leitura de SSE é extraída para um helper reutilizável (função pura, não hook) em `lib/api/extract-sse.ts` para não duplicar entre os dois componentes.

**Tratamento de erro:** evento `error` exibe mensagem exatamente como hoje. O abort controller de 75s do lado do cliente continua funcionando — cancelar fecha o stream e restaura o estado do botão.

---

## Testes

- `formatTablePagesAsMarkdown`: testes unitários em `tests/lib/calibration-extraction.test.ts` — tabelas vazias, linhas parcialmente vazias, truncamento junto com texto principal.
- O helper SSE (`lib/api/extract-sse.ts`) é função pura e pode ser testado isoladamente se necessário.
- O endpoint em si não tem teste unitário (depende de rede/LLM) — validar manualmente no fluxo real.

---

## Sequência de implementação sugerida

1. `formatTablePagesAsMarkdown` + testes
2. Integrar formatação no prompt de extração
3. Converter endpoint para SSE
4. Helper de leitura SSE no frontend
5. Atualizar `instrument-calibration-create-content.tsx`
6. Atualizar `instrument-create-content.tsx`
## Relacionado
- [[arquitetura/ia-pipeline]] — SSE documentado
- [[modulos/calibration-extraction]] — formatação de tabelas
- [[api/calibracoes-extrair]] — endpoint SSE
