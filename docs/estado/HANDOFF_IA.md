# Handoff Para Outra IA

## Leia isto primeiro

Este arquivo dá contexto operacional rápido. Para detalhes completos, comece por `docs/00-INDEX.md`.

## Estado atual (2026-04-23)

Suite de testes: **85 testes passando** (adicionado 3 para setores), cobertura de statements em **87%+**.

### Última sessão — Setor de Uso (Task 1 de 8)

**CONCLUÍDO:** Implementação de `lib/setores.ts` com tipos `SetorRow` e `SetorItem`, funções `mapSetorRow()` (trim campos) e `formatSetorLabel()` (formato "codigo – nome"). Testes unitários todos passando. Build limpo.

Branch: `feat/setor-instrumentos` (commit: `fa43b46`)

Próxima: Task 2 — Migração SQL no Supabase (criar tabela `setores`, adicionar FK em `instrumentos`)

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
