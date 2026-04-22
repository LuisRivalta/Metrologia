---
tags: [dominio, regras]
---

# Regras Críticas do Domínio

Regras que não podem ser violadas sem quebrar o sistema.

## 1. PDF é obrigatório

Toda calibração exige upload de certificado em PDF. O backend valida antes de salvar.

## 2. IA só sugere — nunca aprova

A extração por IA pré-preenche campos. O usuário revisa e confirma. Nenhum valor da IA é salvo automaticamente.

## 3. Campos derivados são calculados no código

Campos como "Incerteza + maior Erro" do Paquímetro são calculados em `lib/calibration-derivations.ts`. A IA não calcula esses campos — se tentar sugerir, o código sobrescreve.

## 4. Paquímetro é categoria especial

Única categoria com regras de derivação locais implementadas. Não tratar como categoria genérica. Regras em `lib/calibration-derivations.ts`, parsers locais em `lib/calibration-certificate-parsers.ts`.

## 5. Categoria não pode ser deletada com instrumentos vinculados

O backend rejeita a deleção se existirem instrumentos usando a categoria.

## 6. observacoes tem formato dual

O campo `calibracoes.observacoes` pode conter JSON estruturado dentro dos marcadores `[[METROLOGIA_CALIBRATION_DATA]]`. Nunca sobrescrever como texto puro. Sempre usar `lib/calibration-records.ts`.

## 7. Slug de campo é derivado — não arbitrário

`slug = serializeMeasurementFieldSlug(name + groupName + subgroupName)`. Alterar qualquer um desses campos independentemente quebra o link entre template e registros existentes.

## 8. Criar instrumento ≠ criar calibração

A rota `POST /api/instrumentos` não cria calibração. Quem orquestra instrumento + calibração inicial é a tela `/instrumentos/novo`.

## Relacionado
- [[dominio/campo-slugs]] — como slugs são derivados
- [[modulos/calibration-derivations]] — regras de derivação do Paquímetro
- [[modulos/calibration-records]] — formato dual de observacoes
- [[modulos/calibration-certificate-parsers]] — parser local de Paquímetro
