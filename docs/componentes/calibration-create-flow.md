---
tags: [componente, ui, calibracao]
arquivo: app/_components/instrument-calibration-create-content.tsx
---

# calibration-create-flow

**Arquivo:** `app/_components/instrument-calibration-create-content.tsx`
**Tipo:** Client Component
**Responsabilidade:** formulário de nova calibração para instrumento existente

## O que faz

Renderiza o formulário de nova calibração: upload de PDF no topo, campos de data, tabela de campos de medição com revisão, extração opcional por IA.

## Fluxo principal

1. Carrega instrumento via `GET /api/instrumentos?id=<id>`
2. Monta tabela com os campos do instrumento
3. PDF sobe primeiro (topo do formulário) — validação imediata de tipo (`.pdf`) e tamanho (≤ 10 MB)
4. Botão "Extrair com IA" (opcional) → SSE → label do botão muda por etapa
5. Aplica `applyCalibrationDerivedValues` após extração
6. Validação inline por campo antes do submit (sem erro genérico)
7. `POST /api/calibracoes` → salva
8. Atualiza `data_ultima_calibracao` e `proxima_calibracao` no instrumento

## Estado relevante

| Estado | O que controla |
|--------|---------------|
| `pdfFile` | Arquivo PDF selecionado |
| `extractionMessage` | Mensagem da etapa atual do SSE |
| `showConfidenceIndicators` | Ativa badges de confiança após extração |
| `validationErrors` | Mapa de erros por campo |

## Pontos de atenção

- `handleExtractWithAi` usa AbortController com timeout de 75s — se ultrapassar, exibe mensagem diferenciada
- `validationErrors.form` é reservado para falhas de servidor (API/rede) — erros inline por campo são suficientes para validação local
- PDF sobe ao topo do formulário (primeira seção visível) — deliberado para forçar upload antes de preencher campos

## Relacionado

- [[api/calibracoes-extrair]] — extração via SSE
- [[api/calibracoes]] — `POST /api/calibracoes`
- [[modulos/calibration-derivations]] — `applyCalibrationDerivedValues`
- [[modulos/calibration-records]] — `serializeCalibrationRecord`
- [[modulos/calibration-certificates]] — `isPdfCertificateFile`, `MAX_CALIBRATION_CERTIFICATE_FILE_SIZE`
- [[historico/specs/2026-04-18-b2-calibration-flow-design]] — spec de UX (validação inline e PDF no topo)

## Código-fonte
[[app/_components/instrument-calibration-create-content.tsx]]
