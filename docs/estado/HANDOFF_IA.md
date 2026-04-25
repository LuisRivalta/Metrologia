# Handoff Para Outra IA

## Leia isto primeiro

Este arquivo dá contexto operacional rápido. Para detalhes completos, comece por `docs/00-INDEX.md`.

## Estado atual (2026-04-25)

Suite de testes: **85 testes passando**, cobertura de statements em **87%+**.

### Última sessão — UX: Linhas Clicáveis na Lista de Instrumentos (COMPLETA, aguardando validação manual)

**CONCLUÍDO:** Linhas da tabela de instrumentos clicáveis em sua totalidade.

Branch: `feat/ux-clickable-rows` — aguardando validação manual antes do merge.

**O que foi entregue:**
- `app/globals.css` — `.inventory-table__row--clickable` com cursor pointer + hover sutil light e dark
- `app/_components/instruments-content.tsx` — `useRouter`, `onClick` no `<tr>`, `stopPropagation` na tag pill e no wrapper das ações

**Checklist de validação manual:**
- [ ] Clicar em qualquer célula (Categoria, Fabricante, Setor, Prazo) navega para `/instrumentos/:id`
- [ ] Clicar na tag pill navega (sem dupla navegação)
- [ ] Clicar no lápis abre o modal (não navega)
- [ ] Clicar no ícone de prancheta abre calibração (não detalhe)
- [ ] Hover exibe fundo sutil em light e dark theme

---

### Sessão anterior — Feature B4: Atalhos de Calibração (COMPLETA, aguardando validação manual)

**CONCLUÍDO:** Todas as 4 tasks da feature "B4: Atalhos de Registro de Calibração" implementadas e aprovadas em revisão.

Branch: `feat/b4-calibration-shortcuts` — aguardando validação manual antes do merge.

**O que foi entregue:**
- `app/globals.css` — grid do `.dashboard-alert-item` reestruturado; novas classes `__main` e `__calibrate`; dark theme e responsivo atualizados; `.table-action` com `inline-flex`
- `app/_components/dashboard-content.tsx` — cards de alerta com dois links: área principal → detalhe, botão "Registrar calibração" → `/instrumentos/:id/calibracoes/nova`
- `app/_components/instruments-content.tsx` — ícone de documento+plus na coluna "Ações" de todas as linhas

**Próximo:** Validação manual no browser + merge `feat/b4-calibration-shortcuts` → `main`.

**Checklist de validação manual:**
- [ ] Dashboard: clicar na área principal do card navega para `/instrumentos/:id`
- [ ] Dashboard: clicar em "Registrar calibração" navega para `/instrumentos/:id/calibracoes/nova`
- [ ] Dashboard: visual correto em light e dark theme
- [ ] Dashboard: em tela estreita, botão ocupa largura total
- [ ] Lista: ícone de prancheta navega para `/instrumentos/:id/calibracoes/nova`
- [ ] Lista: lápis ainda abre o modal de edição
- [ ] Lista: dois ícones alinhados lado a lado na coluna "Ações"

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
