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
