# Handoff Para Outra IA

## Leia isto primeiro

Este arquivo dá contexto operacional rápido. Para detalhes completos, comece por `docs/00-INDEX.md`.

## Estado atual (2026-04-28)

Suite de testes: **101 testes passando**, cobertura de statements em **89.55%**, branches em **75.9%**.

### Última sessão — Expansão de cobertura de testes (COMPLETA)

Adicionados 16 novos testes nos módulos de lib. Cobertos: empty-string branches em `measurements.ts`, invalid date em `instruments.ts`, edge cases em `calibration-records.ts`, `calibration-derivations.ts` e `categories.ts`. Total: 85 → 101 testes, branches: 71.77% → 75.9%.

---

### Sessão anterior — Filtros Persistentes via URL + Chips Visuais (COMPLETA, mergeada)

Feature implementada em 3 tasks via Subagent-Driven Development. Push feito para `main`.

**O que foi feito:**
- `initialCategory`, `initialManufacturer`, `initialSetor` lidos do `searchParams` no mount
- `syncFiltersToURL(filters)` helper dentro de `InstrumentsContent` — constrói URLSearchParams e chama `router.replace` com `scroll: false`
- Os 4 selects de filtro e o botão "Limpar filtros" chamam `syncFiltersToURL` após cada mudança
- `activeChips` useMemo gera chips `{ key, label, onRemove }` para cada filtro ativo; renderizados em `.filter-chips` entre o painel de filtros e a tabela; label do setor via `formatSetorLabel`; botão "Limpar tudo"
- CSS: `.filter-chips`, `.filter-chip`, `.filter-chip button`, `.filter-chips__clear` com dark theme

---

### Sessão anterior — Melhorias no Editor de Categorias (COMPLETA, mergeada)

- `defaultMeasurementId` por subgrupo propaga medida para linhas novas e existentes
- `copyFieldDraftSubgroup` duplica subgrupo inteiro com novos `clientId`
- Confirmação modal antes de remover grupo ou subgrupo inteiro
- Validação "mínimo 1 campo" removida — template pode ficar vazio
- Layout do editor em 2 colunas; modal alargado para 1100px; responsivo ≤ 820px

---

### Sessão anterior — UX: Linhas Clicáveis (COMPLETA, mergeada)

Linhas da tabela de instrumentos clicáveis via `onClick` no `<tr>` + `router.push`. `stopPropagation` no link da tag e no wrapper das ações preserva o comportamento existente. CSS: `cursor: pointer` + hover sutil light/dark.

---

### Sessão anterior — Feature B4: Atalhos de Calibração (COMPLETA, mergeada)

Cards de alerta do dashboard reestruturados com dois alvos: área principal → detalhe do instrumento, botão "Registrar calibração" → `/instrumentos/:id/calibracoes/nova`. Mesma ação adicionada como ícone na coluna "Ações" da lista de instrumentos.

## Para navegar o código

Leia `docs/00-INDEX.md` — tem links `[[...]]` para tudo.

Atalhos rápidos:
- Regras do domínio que não podem quebrar → [[dominio/regras-criticas]]
- Calibração e `observacoes` → [[modulos/calibration-records]]
- Paquímetro → [[modulos/calibration-derivations]] e [[modulos/calibration-certificate-parsers]]
- Pipeline de IA → [[arquitetura/ia-pipeline]] e [[modulos/calibration-extraction]]
- Instrumentos e prazos → [[modulos/instruments]]
- Slugs de campos → [[dominio/campo-slugs]]
- Setores → [[modulos/setores]] e [[api/setores]]

## Próximos passos sugeridos

- Expandir cobertura de testes (branches ainda em 70%)
- Ampliar regras derivadas para outras categorias além do Paquímetro
- Melhorar qualidade/velocidade da extração por IA

## Armadilhas ativas

- A tela `/instrumentos` ainda tem modal de criação/edição rápida além do fluxo novo em `/instrumentos/novo`
- O backend de calibração ainda aceita `laboratory` e `certificate`, mas a UI atual não expõe esses campos
- `lib/api/client.ts` é o fetch helper (não `fetch-api.ts`)
- Criar instrumento via `POST /api/instrumentos` **não** cria calibração — isso é responsabilidade da UI em `/instrumentos/novo`
- `setorRowsResponse` em `metadata/route.ts` falha silenciosamente (retorna `[]`) para não bloquear o carregamento de metadados

## Como validar alterações

```bash
npm run test           # regras puras
npm run test:coverage  # cobertura
npm run build          # fluxo real do app
```
