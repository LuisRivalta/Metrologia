# Rotina de TDD

## Objetivo
Usar testes pequenos e rapidos para proteger regras de negocio antes de mexer em fluxos da aplicacao.

## Scripts
- `npm run test`: roda a suite inteira uma vez.
- `npm run test:watch`: deixa o Vitest observando alteracoes.
- `npm run test:tdd`: alias para o modo watch, pensado para o ciclo de TDD.

## Ciclo padrao
1. Escolha um comportamento novo ou um bug real.
2. Escreva primeiro um teste que falha.
3. Implemente o minimo para deixar o teste verde.
4. Refatore com a suite verde.
5. Rode `npm run test` antes de abrir PR.
6. Se a mudanca tocar interface, finalize com `npm run build`.

## Onde escrever testes
- `tests/lib/*.test.ts` para regras puras de negocio.
- Ao encontrar logica dentro de componentes ou rotas, extraia para `lib/` antes de testar.
- Nomeie os testes pelo comportamento esperado, nao pela implementacao.

## Regra pratica para este projeto
- Datas, serializacao e calculos de calibracao devem ganhar teste antes de ajuste.
- Validacoes de payload devem nascer em funcoes puras sempre que possivel.
- Bugs corrigidos devem voltar com um teste que reproduza o caso original.

## Fluxo recomendado
```bash
npm run test:tdd
```

Com o watch aberto:
- escreva um teste vermelho
- implemente o minimo
- confirme o verde
- refatore

## Suite inicial criada
- `tests/lib/date-utils.test.ts`
- `tests/lib/categories.test.ts`
- `tests/lib/measurements.test.ts`
- `tests/lib/instruments.test.ts`
