# Metrologia PRO

Sistema web para controle de instrumentos, categorias, unidades de medida, prazos de calibracao e historico tecnico de certificados.

## Visao geral
- Aplicacao em `Next.js App Router` com `TypeScript`.
- Persistencia principal em `Supabase`, usando o schema `calibracao`.
- Fluxo focado em operacao interna de metrologia, cadastro tecnico, rastreabilidade e acompanhamento de conformidade.

## O que ja existe
- CRUD real de unidades de medida.
- CRUD real de categorias.
- CRUD real de instrumentos.
- Dashboard com dados reais.
- Detalhe individual por instrumento.
- Log de calibracoes por instrumento.
- Cadastro de nova calibracao com upload de PDF.
- Cadastro de novo instrumento em 2 etapas:
  - dados do instrumento
  - certificado e calibracao inicial
- Extracao assistida por IA de certificados em PDF.
- Confirmacoes explicitas em fluxos sensiveis.
- Rotina de TDD com cobertura.

## Regras atuais importantes
- Categoria define o template de calibracao do instrumento.
- Instrumento herda os itens da categoria no cadastro.
- O nome do PDF enviado passa a identificar a calibracao no log.
- `Fabricante` e opcional.
- A IA ajuda no pre-preenchimento, mas a revisao final continua humana.
- Alguns campos podem ser calculados automaticamente por categoria.
  - Exemplo atual: `Paquimetro`.

## Stack
- Next.js
- React
- TypeScript
- Supabase
- Motion
- Three.js
- CSS global

## Estrutura principal
- `app/`: paginas, layouts e rotas API.
- `app/_components/`: componentes reutilizaveis da interface.
- `app/api/`: rotas server-side.
- `lib/`: regras de negocio, mapeadores, serializacao e helpers.
- `tests/`: testes unitarios da camada de regra.
- `public/`: assets estaticos.

## Como rodar
```bash
npm install
npm run dev
```

Aplicacao local:
```bash
http://localhost:3000
```

## Variaveis de ambiente
No minimo, o projeto espera:

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
OPENROUTER_API_KEY=""
OPENROUTER_CALIBRATION_EXTRACTION_MODEL="nvidia/nemotron-nano-12b-v2-vl:free"
```

## Extracao por IA
- Provider atual: `OpenRouter`.
- Modelo atual: `nvidia/nemotron-nano-12b-v2-vl:free`.
- O fluxo envia o PDF e tenta devolver JSON estruturado para preencher a tabela de calibracao.
- Em modelos `:free`, o backend usa timeout menor para evitar espera longa na interface.
- A IA nao e fonte de verdade para calculos derivados; calculos criticos devem ser feitos no sistema.

## Testes e TDD
```bash
npm run test
npm run test:tdd
npm run test:coverage
npm run test:ci
```

Documentacao detalhada:
- [TDD.md](/c:/Metrologia/TDD.md)

## Documentacao do projeto
- [CONTEXT.md](/c:/Metrologia/CONTEXT.md)
- [LOGS.md](/c:/Metrologia/LOGS.md)
- [PRD_Metrologia.md](/c:/Metrologia/PRD_Metrologia.md)
- [TDD.md](/c:/Metrologia/TDD.md)
