# Metrologia PRO

Sistema web para controle de instrumentos, categorias, unidades de medida, prazos de calibracao e rotinas metrologicas internas.

## Visao geral
- Aplicacao construida com Next.js App Router e TypeScript.
- Persistencia principal em Supabase.
- Interface focada em operacao interna, cadastro tecnico e acompanhamento de conformidade.

## Stack
- Next.js
- React
- TypeScript
- Supabase
- CSS global
- CSS Modules
- Three.js
- Motion

## Funcionalidades implementadas
- CRUD real de unidades de medida
- CRUD real de categorias
- CRUD real de instrumentos
- Dashboard com dados reais do projeto
- Detalhe individual por instrumento
- Confirmacoes de exclusao em fluxos sensiveis

## Como rodar
```bash
npm install
npm run dev
```

Aplicacao local:
```bash
http://localhost:3000
```

## Extracao por IA
Para habilitar a leitura de certificados em PDF com Gemini, adicione no [`.env.example`](/c:/Metrologia/.env.example) as variaveis equivalentes no seu `.env`:

```env
GEMINI_API_KEY=""
GEMINI_CALIBRATION_EXTRACTION_MODEL="gemini-2.5-flash"
```

## Testes e TDD
```bash
npm run test
npm run test:watch
npm run test:tdd
```

A rotina completa de TDD do projeto esta em [TDD.md](/c:/Metrologia/TDD.md).

## Documentacao
- [CONTEXT.md](/c:/Metrologia/CONTEXT.md)
- [LOGS.md](/c:/Metrologia/LOGS.md)
- [PRD_Metrologia.md](/c:/Metrologia/PRD_Metrologia.md)
- [TDD.md](/c:/Metrologia/TDD.md)
