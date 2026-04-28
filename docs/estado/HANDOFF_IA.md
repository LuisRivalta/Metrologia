# Handoff Para Outra IA

## Leia isto primeiro

Este arquivo dá contexto operacional rápido. Para detalhes completos, comece por `docs/00-INDEX.md`.

## Estado atual (2026-04-27)

Suite de testes: **85 testes passando**, cobertura de statements em **87%+**.

### Última sessão — Melhorias no Editor de Categorias (em progresso, não commitado)

**Mudanças não commitadas presentes no `main`:**

**`app/_components/categories-content.tsx`:**
- `CategoryFieldDraftSubgroup` ganhou `defaultMeasurementId` — ao definir, propaga a medida para todas as linhas do subgrupo e para novas linhas adicionadas
- `copyFieldDraftSubgroup` — novo botão "Copiar subgrupo" duplica o subgrupo e suas linhas com novos `clientId`
- `openRemoveGroupConfirm` / `openRemoveSubgroupConfirm` — confirmação antes de remover grupo ou subgrupo inteiro (estado `pendingRemoveFieldIds` + `pendingRemoveLabel`)
- Validação "mínimo 1 campo" removida — categoria pode ser salva com template vazio

**`app/api/categorias/route.ts`:**
- Validação "mínimo 1 campo" removida de `sanitizeMeasurementFields` (alinhado com UI)

**`app/api/instrumentos/metadata/route.ts`:**
- `setorRowsResponse` tratado de forma independente — erro de permissão na tabela `setores` não bloqueia carregamento do resto dos metadados; retorna `[]` no caso de erro

**`app/globals.css`:**
- `.template-preview__subgroup-header` com `flex + justify-content: space-between` para acomodar o botão de remoção
- `.field-editor-modal__section-actions` para alinhar ações de seção (copiar + remover) lado a lado
- `.field-editor-modal__subgroups` com `grid-template-columns: repeat(2, ...)` (2 colunas no editor)
- `.instrument-delete-confirm.field-editor-modal` alargado para `min(100%, 1100px)`
- Responsivo: `.field-editor-modal__subgroups` colapsa para 1 coluna em ≤ 820px

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

- Commitar as melhorias de categorias (validar + commitar mudanças não commitadas)
- Implementar filtros persistentes via URL + chips visuais (spec pronta: `docs/superpowers/specs/2026-04-25-filtros-persistentes-url-design.md`)
- Expandir cobertura de testes (branches ainda em 70%)

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
