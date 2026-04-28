# Rotina de TDD

## Objetivo
Proteger regras de negocio e serializacao do sistema com testes pequenos, rapidos e orientados a comportamento.

## Ferramentas
- Runner: `Vitest`
- Ambiente: `node`
- Alias: `@` aponta para a raiz do projeto
- Cobertura: `v8`

## Comandos
- `npm run test`: roda a suite completa uma vez
- `npm run test:watch`: watch simples do Vitest
- `npm run test:tdd`: watch para ciclo vermelho -> verde -> refatorar
- `npm run test:coverage`: gera texto, HTML e `coverage-summary.json`
- `npm run test:ci`: executa `test` e `build`

## Cobertura configurada
- Inclui: `lib/**/*.ts`
- Exclui:
  - `lib/api/**`
  - `lib/server/**`
  - `lib/supabase/**`

Arquivos gerados:
- `coverage/index.html`
- `coverage/coverage-summary.json`

## Suite atual
- `tests/lib/calibrations.test.ts`
- `tests/lib/calibration-certificate-parsers.test.ts`
- `tests/lib/calibration-certificates.test.ts`
- `tests/lib/calibration-derivations.test.ts`
- `tests/lib/calibration-extraction.test.ts`
- `tests/lib/calibration-records.test.ts`
- `tests/lib/categories.test.ts`
- `tests/lib/dashboard-metrics.test.ts`
- `tests/lib/date-utils.test.ts`
- `tests/lib/instruments.test.ts`
- `tests/lib/measurement-fields.test.ts`
- `tests/lib/measurements.test.ts`
- `tests/lib/setores.test.ts`

## O que deve ser testado primeiro neste projeto
- Regras de prazo e comparacao de datas
- Normalizacao e serializacao de medidas
- Slug e agrupamento de campos de medicao
- Regras derivadas por categoria
- Serializacao e parse de `observacoes`
- Filtros e status do historico de calibracao
- Paths e validacoes de certificados PDF
- Normalizacao da extracao assistida por IA
- Parsers locais de certificados conhecidos

## Estrategia pratica
1. Escolha um comportamento observavel ou um bug real.
2. Escreva primeiro um teste que falha pelo motivo certo.
3. Rode `npm run test:tdd`.
4. Implemente o minimo para deixar o teste verde.
5. Refatore sem mudar comportamento.
6. Rode `npm run test`.
7. Se a mudanca tocar fluxo real, finalize com `npm run build`.

## Onde colocar novos testes
- Preferencia: `tests/lib/*.test.ts`
- Se a regra estiver enterrada em componente ou rota, extraia primeiro para `lib/`
- Evite testar JSX quando o comportamento puder ser testado como funcao pura

## Convencoes de nome
- Prefira nomes pelo comportamento:
  - `it("calcula ...")`
  - `it("normaliza ...")`
  - `it("retorna erro quando ...")`
  - `it("ignora ...")`
- Evite nomes presos a detalhes internos de implementacao

## Regras especificas desta base
- Mudou serializacao de calibracao: teste `lib/calibration-records.ts`
- Mudou derivacao por categoria: teste `lib/calibration-derivations.ts`
- Mudou leitura local de certificados: teste `lib/calibration-certificate-parsers.ts`
- Mudou unidade de medida ou slug: teste `lib/measurements.ts` e `lib/measurement-fields.ts`
- Corrigiu bug de negocio: inclua teste que reproduz o caso original

## Checklist de pronto
- Existe teste para o comportamento alterado
- O teste falhou antes da implementacao
- A implementacao minima deixou o teste verde
- `npm run test` passou
- `npm run build` passou quando a alteracao afetou fluxo real

## Relacionado

- [[historico/specs/2026-04-18-technical-health-design]] — spec da campanha de cobertura P0/P1/P2

## Limite atual da estrategia
- O projeto nao tem hoje uma suite estruturada de testes de componente ou E2E
- O foco atual esta em blindar a camada de regra e serializacao
- Se algum fluxo de UI ficar complexo demais, extraia a logica antes de tentar validar
