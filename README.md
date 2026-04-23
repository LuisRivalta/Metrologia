# Metrologia PRO

Sistema web interno para controle de instrumentos, templates de calibração por categoria, prazos de vencimento, histórico técnico de certificados e extração assistida por IA a partir de PDFs.

## Stack

- Next.js 15 App Router + React 19 + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- OpenRouter (extração por IA)
- Vitest

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

## Variáveis de ambiente obrigatórias

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
OPENROUTER_API_KEY=""
```

## Comandos

```bash
npm run build          # build de produção
npm run lint           # ESLint via Next.js
npm run test           # suite completa (Vitest)
npm run test:tdd       # watch mode TDD
npm run test:coverage  # cobertura
npm run test:ci        # test + build
```

## Documentação

Para entender o sistema antes de tocar no código, leia `docs/00-INDEX.md`.

- `docs/estado/HANDOFF_IA.md` — estado atual e próximos passos
- `docs/produto/PRD.md` — escopo e requisitos
- `docs/arquitetura/` — stack, banco, pipeline de IA
- `docs/modulos/` — um doc por arquivo `lib/`
- `docs/componentes/` — fluxos de UI
- `docs/api/` — endpoints
