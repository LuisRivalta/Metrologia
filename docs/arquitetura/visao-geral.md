---
tags: [arquitetura]
---

# Visão Geral da Arquitetura

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 App Router |
| UI | React 19, TypeScript 5.8 |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| IA | OpenRouter (`nvidia/nemotron-nano-12b-v2-vl:free`) |
| Testes | Vitest + v8 coverage |
| Animações | motion, three |
| PDF | pdf-parse |

## Request Path

```
Browser → fetchApi (injeta Bearer token) → middleware.ts (valida sessão) → API Route (supabaseAdmin) → Supabase
```

- `lib/api/fetch-api.ts` injeta `Authorization: Bearer <access_token>` automaticamente
- `middleware.ts` valida por bearer token ou cookies `metrologia-access-token` / `metrologia-refresh-token`
- API routes usam `supabaseAdmin` (service role key) — nunca o browser client

## Estrutura de Pastas

```
app/              ← páginas, layouts, componentes, rotas API
app/_components/  ← UI, formulários, componentes visuais
app/api/          ← endpoints internos protegidos
lib/              ← regras de negócio, serializadores, mapeadores
lib/server/       ← carregamento server-side (RSC)
lib/supabase/     ← clientes Supabase e sync de sessão
tests/lib/        ← testes unitários da camada lib/
```

## Páginas

| Rota | Descrição |
|------|-----------|
| `/login` | Login com Supabase Auth |
| `/dashboard` | Métricas reais do parque |
| `/categorias` | CRUD de categorias e templates |
| `/instrumentos` | Lista com filtros |
| `/instrumentos/novo` | Fluxo 2 etapas: dados + calibração inicial |
| `/instrumentos/[id]` | Detalhe do instrumento |
| `/instrumentos/[id]/calibracoes` | Histórico de calibrações |
| `/instrumentos/[id]/calibracoes/nova` | Nova calibração |
| `/configuracoes/medidas` | CRUD de unidades de medida |

## Relacionado
- [[arquitetura/data-layer]] — banco e schemas
- [[arquitetura/ia-pipeline]] — pipeline de extração
- [[dominio/modelo]] — entidades do domínio
- [[estado/HANDOFF_IA]] — estado atual
