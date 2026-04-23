# Handoff Para Outra IA

## Leia isto primeiro

Este arquivo dá contexto operacional rápido. Para detalhes completos, comece por `docs/00-INDEX.md`.

## Estado atual (2026-04-23)

Suite de testes: **85 testes passando**, cobertura de statements em **87%+**.

### Última sessão — Feature Setor de Uso (COMPLETA)

**CONCLUÍDO:** Todas as 8 tasks da feature "Setor de Uso em Instrumentos" implementadas e aprovadas.

Branch: `feat/setor-instrumentos` — pronta para merge.

**O que foi entregue:**
- `lib/setores.ts` — tipos `SetorRow`, `SetorItem`, `mapSetorRow`, `formatSetorLabel`
- `tests/lib/setores.test.ts` — 3 testes unitários
- `app/api/setores/route.ts` — CRUD GET/POST/PATCH/DELETE
- DB: `calibracao.setores` (tabela) + `calibracao.instrumentos.setor_id` (FK nullable)
- `lib/instruments.ts` — `InstrumentDbRow` com `setor_id`, `InstrumentItem` com `setor: SetorItem | null`, `mapInstrumentRow` com `setoresById` como 3º parâmetro
- `app/api/instrumentos/route.ts` — carrega setores em paralelo, inclui `setor_id` em todos os SELECTs/payloads
- `app/api/instrumentos/metadata/route.ts` — retorna `setores` no JSON
- `app/_components/setores-content.tsx` + `app/configuracoes/setores/page.tsx` — UI CRUD de setores
- `app/_components/settings-home-content.tsx` — atalho para `/configuracoes/setores`
- `app/_components/instrument-create-content.tsx` — dropdown setor opcional
- `app/_components/instruments-content.tsx` — coluna setor, filtro por setor, campo setor no modal de edição

**Próximo:** Merge da branch `feat/setor-instrumentos` → `main`.

## Para navegar o código

Leia `docs/00-INDEX.md` — tem links `[[...]]` para tudo.

Atalhos rápidos:
- Regras do domínio que não podem quebrar → [[dominio/regras-criticas]]
- Calibração e `observacoes` → [[modulos/calibration-records]]
- Paquímetro → [[modulos/calibration-derivations]] e [[modulos/calibration-certificate-parsers]]
- Pipeline de IA → [[arquitetura/ia-pipeline]] e [[modulos/calibration-extraction]]
- Instrumentos e prazos → [[modulos/instruments]]
- Slugs de campos → [[dominio/campo-slugs]]

## Próximos passos sugeridos

- B4: ações rápidas no dashboard (registrar calibração sem sair da página) ou melhorias de UX na lista de instrumentos
- Expandir cobertura de testes (branches ainda em 70%)

## Armadilhas ativas

- A tela `/instrumentos` ainda tem modal de criação/edição rápida além do fluxo novo em `/instrumentos/novo`
- O backend de calibração ainda aceita `laboratory` e `certificate`, mas a UI atual não expõe esses campos
- `lib/api/client.ts` é o fetch helper (não `fetch-api.ts`)
- Criar instrumento via `POST /api/instrumentos` **não** cria calibração — isso é responsabilidade da UI em `/instrumentos/novo`

## Como validar alterações

```bash
npm run test           # regras puras
npm run test:coverage  # cobertura
npm run build          # fluxo real do app
```
