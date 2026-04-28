---
tags: [historico, spec, ia]
feature: B1 — AI Pipeline Confiabilidade
data: 2026-04-20
---
# B1 — AI Pipeline: Confiabilidade e Visibilidade

**Data:** 2026-04-20
**Abordagem:** Cirúrgica — log estruturado, fallback de modelo e indicadores de confiança na UI
**Meta:** Melhorar confiabilidade do pipeline de extração e dar visibilidade ao desenvolvedor e ao usuário quando algo falha ou retorna valores incertos

---

## Contexto

O pipeline atual de extração por IA:
1. `pdf-parse` extrai texto/tabelas do PDF (timeout 8s)
2. Monta prompt com slugs, hints e texto extraído (ou envia PDF direto se texto insuficiente)
3. Chama OpenRouter (`nvidia/nemotron-nano-12b-v2-vl:free` por padrão, 20s timeout)
4. Fallback: se `json_schema` não suportado, retenta sem ele
5. Normaliza resposta → aplica overrides locais (Paquímetro/Metrus)

**Dores:**
- Timeout do modelo gratuito é frequente — sem fallback para outro modelo
- Mensagens de erro não distinguem timeout de erro de parsing de indisponibilidade
- Developer não vê o que foi enviado ao modelo nem o que veio de volta
- UI não mostra diferença entre "IA preencheu com confiança", "baixa confiança" e "não encontrado"

---

## O que muda

### 1. `app/api/calibracoes/extrair/route.ts`

**Log estruturado após cada chamada ao OpenRouter**

Emite `console.log(JSON.stringify({...}))` após cada tentativa:

```json
{
  "event": "calibration_extraction",
  "model": "nvidia/nemotron-nano-12b-v2-vl:free",
  "attempt": 1,
  "pdf_text_chars": 4200,
  "pdf_sent_as_file": false,
  "status": 200,
  "ok": true,
  "fields_filled": 6,
  "fields_total": 8,
  "raw_response_snippet": "{ \"header\": {..."
}
```

Campos:
- `event`: sempre `"calibration_extraction"`
- `model`: modelo usado na tentativa
- `attempt`: `1` para tentativa primária, `2` para fallback de modelo
- `pdf_text_chars`: número de caracteres do texto extraído pelo pdf-parse (0 se PDF enviado como arquivo)
- `pdf_sent_as_file`: `true` quando o PDF é enviado como data URL ao modelo
- `status`: HTTP status da resposta do OpenRouter (ou `-1` em caso de AbortError/TransportError)
- `ok`: `true` se extração retornou resultado utilizável
- `fields_filled`: número de campos com `value !== null` no resultado normalizado
- `fields_total`: número de campos esperados
- `raw_response_snippet`: primeiros 300 caracteres da resposta bruta do modelo (truncado)

O log é emitido mesmo em caso de falha, com `ok: false` e `status` correspondente.

**Fallback de modelo**

Nova variável de ambiente opcional:
```env
OPENROUTER_FALLBACK_MODEL=""  # vazio = sem fallback
```

Trigger de fallback: o modelo primário retornou `AbortError` (timeout) OU status `503`.

Comportamento:
1. Log da tentativa primária com `attempt: 1` e `ok: false`
2. Segunda chamada ao OpenRouter com `OPENROUTER_FALLBACK_MODEL`
3. Log da tentativa secundária com `attempt: 2`
4. Se o fallback também falhar, retorna o erro da segunda tentativa

O fallback NÃO é acionado para erros 400, 401, 402, 429 — esses indicam problema de configuração ou payload, não indisponibilidade do modelo.

O timeout do fallback usa a mesma lógica existente (`getOpenRouterTimeoutMs`) baseada no sufixo `:free` do nome do modelo.

### 2. `app/_components/instrument-calibration-create-content.tsx`

**Indicadores de confiança na tabela de campos pós-extração**

A `CalibrationFieldReviewTable` recebe `confidence` por campo. A lógica de exibição:

| Situação | Indicador |
|---|---|
| `value !== null` e `confidence >= 0.7` | Sem indicador extra |
| `value !== null` e `0 < confidence < 0.7` | Badge/texto "baixa confiança" em amarelo |
| `value === null` após extração ter sido executada | Texto "não encontrado" em cinza no lugar do campo vazio |
| `confidence === null` (campo não retornado) | Sem indicador |

O indicador é mostrado apenas **após a extração ser executada** (`extractionMessage` definida). Antes da extração, a tabela continua como hoje.

Nenhum novo estado é adicionado — os dados de `confidence` e `value` já existem em `fieldResults`.

---

## O que não muda

- Nenhum arquivo em `lib/` alterado
- Nenhuma nova rota de API
- Nenhum schema de banco alterado
- Pipeline de extração idêntico (pdf-parse → prompt → OpenRouter → normalize → overrides locais)
- Lógica de derivação do Paquímetro intacta
- O fallback existente de `json_schema → json_object` permanece (é diferente do novo fallback de modelo)

---

## Variável de ambiente nova

```env
# Opcional. Se vazio, não há fallback de modelo.
OPENROUTER_FALLBACK_MODEL=""
```

Adicionar ao `.env.example` ou documentação interna. Não bloqueia o sistema se ausente.

---

## Validação

**Manual:**
1. Extração com PDF válido → log aparece no console com campos corretos
2. Com `OPENROUTER_FALLBACK_MODEL` definido e primário simulando timeout → log mostra `attempt: 1` (falha) e `attempt: 2` (resultado)
3. Após extração bem-sucedida → tabela mostra indicadores de confiança corretos por campo
4. Campo não encontrado pela IA → mostra "não encontrado" em cinza

**Automatizado:**
- `npm run test` — 73 testes passando (nenhum `lib/` alterado)
- `npm run build` — build limpo (valida tipos do componente e da rota)

---

## Arquivos principais

| Arquivo | Mudança |
|---|---|
| `app/api/calibracoes/extrair/route.ts` | Log estruturado + fallback de modelo |
| `app/_components/instrument-calibration-create-content.tsx` | Indicadores de confiança pós-extração |
## Relacionado
- [[arquitetura/ia-pipeline]] — pipeline atualizado
- [[modulos/calibration-extraction]] — extração e logging
- [[api/calibracoes-extrair]] — endpoint atualizado
