---
tags: [modulo, lib, paquimetro]
arquivo: lib/calibration-derivations.ts
---

# calibration-derivations

**Arquivo:** `lib/calibration-derivations.ts`
**Responsabilidade:** cálculo automático de campos derivados por categoria (hoje só Paquímetro)

## O que faz

Aplica regras de derivação sobre um array de campos de calibração. Para Paquímetro, calcula automaticamente os campos "Incerteza + maior Erro" somando os pares de campos-fonte.

## Funções principais

| Função | Linha | O que faz |
|--------|-------|-----------|
| `isAutoCalculatedCalibrationField` | ~120 | Retorna `true` se o `fieldSlug` é calculado automaticamente para a categoria |
| `applyCalibrationDerivedValues` | ~127 | Aplica regras de derivação e retorna o array de campos com valores calculados |

## Regras de Paquímetro (linhas 16–45)

| Campo derivado | Fontes |
|---------------|--------|
| `Incerteza + maior Erro externo` | `Maior erro externo` + `Incerteza de medicao externo` |
| `Incerteza + maior Erro interno` | `Incerteza de medicao interno` + `Maior erro interno` |
| `Incerteza + maior Erro profundidade` | `Maior erro profundidade` + `Incerteza de medicao profundidade` |
| `Incerteza + maior Erro ressalto` | `Maior erro ressalto` + `Incerteza de medicao ressalto` |

A detecção de Paquímetro é por `isPaquimetroCategory` (linha ~58): normaliza o identificador e verifica se contém "paquimetro".

## Contexto de criação

Criado quando o time percebeu que certos campos do Paquímetro são sempre soma de outros dois. Automatizar evita erro humano e garante consistência. Isolado neste arquivo para não vazar regra de categoria em código genérico.

## Regras críticas

- Campos derivados têm `confidence: null` e `evidence: ""` — não vieram da IA
- Se um dos campos-fonte estiver vazio, o campo derivado fica vazio (não NaN)
- A soma usa o número de casas decimais do máximo entre os dois valores-fonte
- `isAutoCalculatedCalibrationField` é usado nos componentes para bloquear edição manual do campo derivado

## Relacionado

- [[dominio/regras-criticas]] — regra #3 e #4
- [[dominio/campo-slugs]] — slugs são a chave das regras de derivação
- [[modulos/measurement-fields]] — `serializeMeasurementFieldSlug` usada nas regras
- [[modulos/calibration-certificate-parsers]] — parser local complementar para Paquímetro
- [[componentes/calibration-create-flow]] — chama `applyCalibrationDerivedValues`

## Código-fonte
[[lib/calibration-derivations.ts]]
