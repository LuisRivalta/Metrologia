---
tags: [modulo, lib, paquimetro, parser]
arquivo: lib/calibration-certificate-parsers.ts
---

# calibration-certificate-parsers

**Arquivo:** `lib/calibration-certificate-parsers.ts`
**Responsabilidade:** parser local de tabelas de certificados conhecidos (hoje só Paquímetro Metrus)

## O que faz

Lê as tabelas extraídas pelo `pdf-parse` de certificados de layout conhecido e gera overrides precisos para os campos de calibração, substituindo ou complementando o que a IA retornou.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `buildPaquimetroFieldOverridesFromTablePages` | ~218 | Se o certificado for Metrus Paquímetro, lê tabelas e retorna `CalibrationExtractionFieldOverride[]` |

## Como detecta o certificado Metrus Paquímetro

`isLikelyMetrusPaquimetroCertificate` (linha ~172) verifica:
- Categoria contém "paquimetro"
- Texto contém "metrus" e "for-0004-paq"
- `tablePages.length >= 2`, página 1 com ≥ 4 tabelas, página 2 com ≥ 2 tabelas

## Estrutura das seções

| Seção | Fonte |
|-------|-------|
| `externo` | Tabelas 0 e 1 da página 1 |
| `interno` | Tabelas 2 e 3 da página 1 |
| `ressalto` | Tabela 0 da página 2 |
| `profundidade` | Tabela 1 da página 2 |

Para cada seção extrai: `error` (maior magnitude), `u` (maior valor numérico).

## Contexto de criação

Criado porque o modelo de IA falha em ler tabelas numéricas de forma confiável em alguns certificados. O parser lê diretamente a estrutura de tabelas do `pdf-parse` com 100% de confiança.

## Regras críticas

- O parser só ativa se o certificado passar TODOS os critérios de `isLikelyMetrusPaquimetroCertificate`
- Campos derivados (`kind === "derived"`) são ignorados — calculados por `calibration-derivations.ts`
- `confidence: 1` nos overrides indica certeza total (leitura direta da tabela)

## Relacionado

- [[modulos/calibration-derivations]] — calcula campos derivados sobre os overrides
- [[modulos/calibration-extraction]] — chama este parser após normalização da IA
- [[api/calibracoes-extrair]] — aplica os overrides no pipeline
- [[dominio/regras-criticas]] — regra #4 (Paquímetro especial)

## Código-fonte
[[lib/calibration-certificate-parsers.ts]]
