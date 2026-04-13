# Rotina de TDD

## Objetivo
Usar testes pequenos, rapidos e orientados a comportamento para proteger regras de negocio antes de alterar fluxos do sistema.

## Comandos
- `npm run test`: roda a suite completa uma vez.
- `npm run test:tdd`: abre o modo watch para o ciclo vermelho -> verde -> refatorar.
- `npm run test:watch`: alias simples do watch do Vitest.
- `npm run test:coverage`: gera cobertura em texto, HTML e `json-summary`.
- `npm run test:ci`: roda `test` e `build` em sequencia para validacao final local.

## Ciclo Completo
1. Escolha um comportamento novo ou um bug real.
2. Escreva primeiro um teste que falha pelo motivo certo.
3. Rode `npm run test:tdd` e confirme o vermelho.
4. Implemente o minimo para deixar o teste verde.
5. Refatore sem mudar comportamento.
6. Rode `npm run test`.
7. Rode `npm run test:coverage` quando a mudanca tocar regra de negocio relevante.
8. Se a mudanca tocar tela, rota ou serializacao importante, finalize com `npm run build`.

## O Que Testar Primeiro
- Datas, vencimentos e comparacoes de prazo.
- Serializacao e parse de registros de calibracao.
- Calculos automaticos por categoria.
- Normalizacao de payloads de API.
- Conversoes de medida, slug e nome tecnico.
- Regressao de bug: todo bug corrigido deve ganhar um teste que reproduza o caso original.

## Onde Escrever Testes
- `tests/lib/*.test.ts` para regras puras de negocio.
- Extraia logica de componentes ou rotas para `lib/` antes de testar.
- De preferencia a testes pequenos e focados em uma regra por vez.

## Nome dos Testes
- Escreva pelo comportamento esperado.
- Prefira `it("calcula ...")`, `it("ignora ...")`, `it("retorna erro quando ...")`.
- Evite nomes presos a detalhes internos de implementacao.

## Estrategia Recomendada Neste Projeto
- Componentes devem ficar finos.
- Regras de metrologia, validacoes e calculos devem morar em `lib/`.
- A IA deve extrair valores; a regra de negocio deve ser testada e calculada localmente.
- Se uma regra variar por categoria, o comportamento da categoria deve ter teste proprio.

## Checklist de Pronto
- Existe teste cobrindo o comportamento novo ou o bug corrigido.
- O teste falhou antes da implementacao.
- A implementacao minima deixou o teste verde.
- A refatoracao manteve a suite verde.
- `npm run test` passou.
- `npm run build` passou quando a mudanca afetou fluxo real da aplicacao.

## Cobertura
O projeto gera cobertura para `lib/**/*.ts`, excluindo camadas de infraestrutura como:
- `lib/api/**`
- `lib/server/**`
- `lib/supabase/**`

Arquivos de saida:
- `coverage/index.html`
- `coverage/coverage-summary.json`

## Exemplo Rapido
```bash
npm run test:tdd
```

No watch:
1. escrever um teste vermelho em `tests/lib/...`
2. implementar o minimo em `lib/...`
3. confirmar o verde
4. refatorar

Depois:
```bash
npm run test
npm run test:coverage
npm run build
```

## Suite Atual
- `tests/lib/calibrations.test.ts`
- `tests/lib/calibration-certificates.test.ts`
- `tests/lib/calibration-derivations.test.ts`
- `tests/lib/calibration-extraction.test.ts`
- `tests/lib/calibration-records.test.ts`
- `tests/lib/categories.test.ts`
- `tests/lib/date-utils.test.ts`
- `tests/lib/instruments.test.ts`
- `tests/lib/measurements.test.ts`
