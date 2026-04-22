---
tags: [modulo, lib, storage]
arquivo: lib/calibration-certificates.ts
---

# calibration-certificates

**Arquivo:** `lib/calibration-certificates.ts`
**Responsabilidade:** validação de arquivo PDF e geração de paths de storage no Supabase

## O que faz

Fornece funções para validar se um arquivo é PDF, construir o path de storage e extrair o path de uma URL pública do Supabase.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `isPdfCertificateFile` | ~28 | Retorna `true` se o arquivo é PDF (por mimetype ou extensão) |
| `buildCalibrationCertificatePath` | ~35 | Gera path `{folder}/{tag}/{calibracao-id-timestamp-nome}.pdf` |
| `getCalibrationCertificateStoragePathFromUrl` | ~52 | Extrai o storage path de uma URL pública do Supabase |
| `sanitizeStoragePathSegment` | ~17 | Limpa um segmento de path (sem acentos, só alfanumérico e `-`) |

## Constantes

| Constante | Valor padrão |
|-----------|-------------|
| `CALIBRATION_CERTIFICATE_BUCKET` | `shiftapp-files` |
| `MAX_CALIBRATION_CERTIFICATE_FILE_SIZE` | `10 * 1024 * 1024` (10 MB) |

## Contexto de criação

Isolado para centralizar a lógica de storage de certificados. O path gerado inclui tag slugificada + timestamp para evitar colisões.

## Relacionado

- [[arquitetura/data-layer]] — bucket e pasta configuráveis por env
- [[api/calibracoes-extrair]] — valida PDF antes de enviar para IA
- [[componentes/calibration-create-flow]] — valida antes de submit

## Código-fonte
[[lib/calibration-certificates.ts]]
