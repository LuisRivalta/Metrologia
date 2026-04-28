---
tags: [historico, spec, docs]
feature: Obsidian Wiki Reorganização
data: 2026-04-22
---
# Obsidian Wiki — Reorganização e Mapa de Código para IA

**Data:** 2026-04-22  
**Status:** Aprovado

## Problema

Os documentos `.md` do projeto estão dispersos na raiz e duplicados entre si. `CONTEXT.md`, `HANDOFF_IA.md` e `README.md` repetem arquitetura, endpoints, schemas e regras de negócio. Não existe documentação por módulo de código — uma IA que precisa alterar `lib/calibration-records.ts` precisa ler o arquivo inteiro para entender o que ele faz, onde ficam as funções relevantes e por que aquela lógica existe.

## Objetivo

Reorganizar todos os `.md` em `docs/` com categorias claras e criar uma camada de documentação por módulo de código (`lib/`, componentes, API routes). Uma IA deve conseguir navegar pelo wiki e encontrar o contexto de qualquer pedaço de código antes de abrir o arquivo.

## Escopo

- **Inclui:** mover docs existentes para `docs/`, criar `00-INDEX.md`, criar docs por módulo (`lib/`, componentes, API), adicionar links Obsidian `[[...]]`, atualizar `CLAUDE.md` com novos paths.
- **Não inclui:** alterar código da aplicação, alterar testes, alterar `CLAUDE.md` além dos paths e referência ao INDEX.

---

## Estrutura de pastas final

```
C:\Metrologia\
├── CLAUDE.md                    ← raiz (lido automaticamente pelo Claude Code)
├── README.md                    ← raiz (thin — stack, como rodar, env vars, link para docs/00-INDEX.md)
└── docs/
    ├── 00-INDEX.md              ← mapa mestre de toda a documentação
    ├── estado/
    │   ├── HANDOFF_IA.md        ← estado operacional atual + próximos passos
    │   └── LOGS.md              ← histórico cronológico de entregas
    ├── produto/
    │   └── PRD.md               ← escopo, requisitos, roadmap
    ├── arquitetura/
    │   ├── visao-geral.md       ← stack, request path, auth flow
    │   ├── data-layer.md        ← schemas Supabase, formato observacoes, storage
    │   └── ia-pipeline.md       ← pipeline OpenRouter, SSE, fallback de modelo
    ├── dominio/
    │   ├── modelo.md            ← Categoria → Instrumento → Calibração
    │   ├── regras-criticas.md   ← paquímetro, slug, PDF obrigatório, IA só sugere
    │   └── campo-slugs.md       ← como slugs são derivados (name+group+subgroup)
    ├── modulos/
    │   ├── calibration-records.md
    │   ├── calibration-derivations.md
    │   ├── calibration-extraction.md
    │   ├── calibration-certificate-parsers.md
    │   ├── calibration-certificates.md
    │   ├── calibrations.md
    │   ├── instruments.md
    │   ├── measurements.md
    │   ├── measurement-fields.md
    │   ├── dashboard-metrics.md
    │   └── categories.md
    ├── componentes/
    │   ├── instrument-create-flow.md
    │   ├── calibration-create-flow.md
    │   ├── dashboard-content.md
    │   └── instruments-content.md
    ├── api/
    │   ├── calibracoes-extrair.md
    │   ├── calibracoes.md
    │   ├── instrumentos.md
    │   └── categorias.md
    ├── testes/
    │   └── TDD.md
    └── historico/
        ├── specs/               ← de docs/superpowers/specs/
        └── planos/              ← de docs/superpowers/plans/
```

---

## Arquivos que mudam de lugar

| Origem | Destino |
|--------|---------|
| `HANDOFF_IA.md` | `docs/estado/HANDOFF_IA.md` |
| `LOGS.md` | `docs/estado/LOGS.md` |
| `PRD_Metrologia.md` | `docs/produto/PRD.md` |
| `TDD.md` | `docs/testes/TDD.md` |
| `CONTEXT.md` | conteúdo absorvido em `docs/arquitetura/visao-geral.md` e `docs/dominio/` — arquivo raiz deletado |
| `docs/superpowers/specs/*.md` | `docs/historico/specs/*.md` |
| `docs/superpowers/plans/*.md` | `docs/historico/planos/*.md` |
| `docs/superpowers/` | deletada após migração dos conteúdos |

---

## Graph view — como funciona a teia

O Obsidian gera o graph view conectando qualquer nota que contenha `[[link]]` para outra nota ou arquivo do vault. Para que os arquivos de código apareçam como satélites no graph (igual ao estilo da imagem de referência), cada doc deve incluir links diretos para os arquivos `.ts` / `.tsx` que documenta, além dos links para outros docs.

Exemplo de como aparece no graph:
- **Hubs grandes** (muito linkados): `00-INDEX.md`, `arquitetura/visao-geral.md`, `dominio/modelo.md`
- **Docs de módulo** (ligados ao hub e ao código): `modulos/calibration-records.md`
- **Satélites de código**: `lib/calibration-records.ts`, `app/api/calibracoes/extrair/route.ts`

---

## Modelo de doc de módulo

Cada arquivo em `docs/modulos/` segue este padrão:

```markdown
---
tags: [modulo, lib]
arquivo: lib/<nome>.ts
---

# <nome>

**Arquivo:** `lib/<nome>.ts`  
**Responsabilidade:** <uma linha>

## O que faz
<descrição concisa do propósito>

## Funções principais
| Função | Linha aprox. | O que faz |
|--------|-------------|-----------|
| `nomeDaFuncao` | ~N | descrição |

## Contexto de criação
<por que este arquivo existe — problema que resolve>

## Regras críticas
- <regra importante que não é óbvia lendo o código>

## Relacionado
- [[dominio/modelo]]
- [[componentes/<componente-que-usa>]]
- [[historico/specs/<spec-de-origem>]]

## Código-fonte
[[lib/<nome>.ts]]
```

> **Nota:** a seção `## Código-fonte` com o link `[[lib/<nome>.ts]]` é o que faz o arquivo de código aparecer como nó no graph view do Obsidian, conectado a este doc.

---

## Modelo de doc de componente

```markdown
---
tags: [componente, ui]
arquivo: app/_components/<nome>.tsx
---

# <nome>

**Arquivo:** `app/_components/<nome>.tsx`  
**Tipo:** Client Component / Server Component  
**Responsabilidade:** <uma linha>

## O que faz
<descrição do fluxo que o componente orquestra>

## Fluxo principal
1. passo 1
2. passo 2
...

## Estado e props relevantes
| Nome | Tipo | O que controla |
|------|------|----------------|

## Pontos de atenção
- <armadilha ou detalhe não óbvio>

## Relacionado
- [[modulos/<lib-que-usa>]]
- [[api/<endpoint-que-chama>]]

## Código-fonte
[[app/_components/<nome>.tsx]]
```

---

## Modelo de doc de API route

```markdown
---
tags: [api, endpoint]
arquivo: app/api/<path>/route.ts
---

# <método> /api/<path>

**Arquivo:** `app/api/<path>/route.ts`  
**Método(s):** GET | POST | PATCH | DELETE  
**Auth:** requer sessão via middleware

## O que faz
<descrição da responsabilidade>

## Parâmetros
| Nome | Onde | Tipo | Obrigatório |
|------|------|------|-------------|

## Resposta
<estrutura do retorno>

## Pontos de atenção
- <detalhe crítico>

## Relacionado
- [[modulos/<lib-que-usa>]]
- [[componentes/<componente-que-chama>]]

## Código-fonte
[[app/api/<path>/route.ts]]
```

---

## Conteúdo de `docs/00-INDEX.md`

O index é a entrada para qualquer IA que não sabe por onde começar. Estrutura:

```markdown
# Índice do Wiki — Metrologia PRO

## Onde estamos
- [[estado/HANDOFF_IA]] — estado atual, próximos passos, armadilhas
- [[estado/LOGS]] — histórico de entregas

## O que estamos construindo
- [[produto/PRD]] — escopo, requisitos, roadmap

## Como o sistema funciona
- [[arquitetura/visao-geral]] — stack, request path, auth
- [[arquitetura/data-layer]] — banco, schemas, observacoes
- [[arquitetura/ia-pipeline]] — extração por IA

## Regras do domínio
- [[dominio/modelo]] — entidades e relações
- [[dominio/regras-criticas]] — regras que não podem quebrar
- [[dominio/campo-slugs]] — como slugs funcionam

## Módulos lib/
- [[modulos/calibration-records]] → lib/calibration-records.ts
- [[modulos/calibration-derivations]] → lib/calibration-derivations.ts
- [[modulos/calibration-extraction]] → lib/calibration-extraction.ts
- [[modulos/calibration-certificate-parsers]] → lib/calibration-certificate-parsers.ts
- [[modulos/calibration-certificates]] → lib/calibration-certificates.ts
- [[modulos/calibrations]] → lib/calibrations.ts
- [[modulos/instruments]] → lib/instruments.ts
- [[modulos/measurements]] → lib/measurements.ts
- [[modulos/measurement-fields]] → lib/measurement-fields.ts
- [[modulos/dashboard-metrics]] → lib/dashboard-metrics.ts
- [[modulos/categories]] → lib/categories.ts

## Componentes complexos
- [[componentes/instrument-create-flow]] → app/_components/instrument-create-content.tsx
- [[componentes/calibration-create-flow]] → app/_components/instrument-calibration-create-content.tsx
- [[componentes/dashboard-content]] → app/_components/dashboard-content.tsx
- [[componentes/instruments-content]] → app/_components/instruments-content.tsx

## API Routes
- [[api/calibracoes-extrair]] → POST /api/calibracoes/extrair
- [[api/calibracoes]] → GET|POST /api/calibracoes
- [[api/instrumentos]] → GET|POST|PATCH|DELETE /api/instrumentos
- [[api/categorias]] → GET|POST|PATCH|DELETE /api/categorias

## Testes
- [[testes/TDD]] — estratégia, comandos, convenções

## Histórico
- [[historico/specs/]] — design specs por feature
- [[historico/planos/]] — planos de implementação
```

---

## Atualizações em `CLAUDE.md`

Duas mudanças cirúrgicas:
1. Paths no bloco "AI Agent Workflow": `HANDOFF_IA.md` → `docs/estado/HANDOFF_IA.md`, `PRD_Metrologia.md` → `docs/produto/PRD.md`, `CONTEXT.md` → `docs/arquitetura/visao-geral.md`, `TDD.md` → `docs/testes/TDD.md`, `LOGS.md` → `docs/estado/LOGS.md`
2. Adicionar linha no workflow: `"Para navegar por módulo de código, leia docs/00-INDEX.md"`

---

## Sequência de implementação

1. Criar estrutura de pastas em `docs/`
2. Mover arquivos existentes para os novos paths
3. Deletar `CONTEXT.md` da raiz (conteúdo vai para arquitetura/ e dominio/)
4. Criar `docs/00-INDEX.md`
5. Criar docs de arquitetura (`visao-geral.md`, `data-layer.md`, `ia-pipeline.md`)
6. Criar docs de domínio (`modelo.md`, `regras-criticas.md`, `campo-slugs.md`)
7. Criar docs de módulos (11 arquivos em `docs/modulos/`)
8. Criar docs de componentes (4 arquivos em `docs/componentes/`)
9. Criar docs de API (4 arquivos em `docs/api/`)
10. Adicionar links `[[...]]` entre todos os docs
11. Atualizar `CLAUDE.md` com novos paths
12. Atualizar `README.md` para ser thin
13. Commit
