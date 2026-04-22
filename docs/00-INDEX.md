---
tags: [index, hub]
---

# Índice do Wiki — Metrologia PRO

Ponto de entrada para qualquer IA navegar a documentação antes de tocar no código.

## Onde estamos agora
- [[estado/HANDOFF_IA]] — estado operacional atual, próximos passos, armadilhas
- [[estado/LOGS]] — histórico cronológico de todas as entregas

## O que estamos construindo
- [[produto/PRD]] — escopo funcional, requisitos, roadmap

## Como o sistema funciona
- [[arquitetura/visao-geral]] — stack, request path, autenticação
- [[arquitetura/data-layer]] — schemas Supabase, formato observacoes, storage
- [[arquitetura/ia-pipeline]] — pipeline OpenRouter, SSE, fallback de modelo

## Regras do domínio
- [[dominio/modelo]] — entidades e relações (Categoria → Instrumento → Calibração)
- [[dominio/regras-criticas]] — regras que não podem quebrar
- [[dominio/campo-slugs]] — como slugs de campos são derivados

## Módulos lib/
- [[modulos/calibration-records]] → `lib/calibration-records.ts`
- [[modulos/calibration-derivations]] → `lib/calibration-derivations.ts`
- [[modulos/calibration-extraction]] → `lib/calibration-extraction.ts`
- [[modulos/calibration-certificate-parsers]] → `lib/calibration-certificate-parsers.ts`
- [[modulos/calibration-certificates]] → `lib/calibration-certificates.ts`
- [[modulos/calibrations]] → `lib/calibrations.ts`
- [[modulos/instruments]] → `lib/instruments.ts`
- [[modulos/measurements]] → `lib/measurements.ts`
- [[modulos/measurement-fields]] → `lib/measurement-fields.ts`
- [[modulos/dashboard-metrics]] → `lib/dashboard-metrics.ts`
- [[modulos/categories]] → `lib/categories.ts`

## Componentes complexos
- [[componentes/instrument-create-flow]] → `app/_components/instrument-create-content.tsx`
- [[componentes/calibration-create-flow]] → `app/_components/instrument-calibration-create-content.tsx`
- [[componentes/dashboard-content]] → `app/_components/dashboard-content.tsx`
- [[componentes/instruments-content]] → `app/_components/instruments-content.tsx`

## API Routes
- [[api/calibracoes-extrair]] → `POST /api/calibracoes/extrair`
- [[api/calibracoes]] → `GET|POST /api/calibracoes`
- [[api/instrumentos]] → `GET|POST|PATCH|DELETE /api/instrumentos`
- [[api/categorias]] → `GET|POST|PATCH|DELETE /api/categorias`

## Testes
- [[testes/TDD]] — estratégia, comandos, convenções

## Histórico de entregas
- [[estado/LOGS]] — log de sessões
- `docs/historico/specs/` — design specs por feature
- `docs/historico/planos/` — planos de implementação
