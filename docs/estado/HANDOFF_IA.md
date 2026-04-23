# Handoff Para Outra IA

## Leia isto primeiro

Este arquivo dá contexto operacional rápido. Para detalhes completos, comece por `docs/00-INDEX.md`.

## Estado atual (2026-04-23)

Suite de testes: **82 testes passando**, cobertura de statements em **87%+**.

### Última sessão — Wiki Obsidian

Reorganização completa da documentação em estrutura wiki categorizada (`docs/`). Todos os arquivos `.md` foram movidos para subpastas temáticas e 22 novos docs de módulos/componentes/API foram criados. `CLAUDE.md` e `README.md` atualizados para apontar para a nova estrutura.

A documentação agora serve como atalho de navegação: antes de abrir um arquivo `.ts`, leia o doc correspondente em `docs/modulos/` para encontrar a função certa sem precisar ler o arquivo inteiro.

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
