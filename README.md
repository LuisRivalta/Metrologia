# Metrologia PRO

Sistema web para gestão de instrumentos, medidas, categorias, prazos de calibração e conformidade metrológica.

## Visão Geral

O projeto foi criado para substituir controles manuais em planilhas por uma aplicação web centralizada, com foco em:

- padronização de cadastros;
- rastreabilidade operacional;
- gestão de vencimentos de calibração;
- preparação para auditorias e evolução futura de certificados e histórico técnico.

## Stack

- Next.js 15
- React 19
- TypeScript
- Supabase
- CSS global em `app/globals.css`

## Estrutura Principal

- `app/`
  - páginas, rotas e APIs do App Router
- `app/_components/`
  - componentes visuais e shells compartilhados
- `app/api/`
  - integração server-side com o banco
- `lib/`
  - mapeamentos, serialização, regras de negócio e clientes Supabase
- `public/`
  - assets estáticos

## Rotas Atuais

- `/login`
- `/dashboard`
- `/instrumentos`
- `/instrumentos/[id]`
- `/categorias`
- `/configuracoes`
- `/configuracoes/medidas`

## APIs Internas

- `/api/medidas`
- `/api/categorias`
- `/api/instrumentos`
- `/api/instrumentos/metadata`
- `/api/centro-custo`

## Integrações

- Supabase Auth
- Supabase Database
- Tabelas já integradas:
  - `calibracao.unidadas_medidas`
  - `calibracao.categorias_instrumentos`
  - `calibracao.instrumentos`
  - `calibracao.categoria_campos_medicao`
  - `calibracao.instrumento_campos_medicao`
  - `datasul.centro_custo`

## Funcionalidades Implementadas

- layout principal com sidebar e alternância de tema;
- tela de login com layout visual dedicado;
- dashboard com dados reais de instrumentos e categorias;
- CRUD de medidas com integração real ao Supabase;
- CRUD de categorias com integração real ao Supabase;
- CRUD de instrumentos com integração real ao schema `calibracao`;
- página individual de detalhe por instrumento;
- modal de instrumento com campos padrão por categoria;
- criação de nova categoria dentro do modal de instrumento;
- consulta de centro de custo por API interna;
- controle de acessibilidade para tamanho de fonte.

## Status Atual

- `medidas`
  - integrado a dados reais;
- `categorias`
  - integrado a dados reais;
- `instrumentos`
  - integrado a dados reais, com detalhe individual e campos de medição;
- `dashboard`
  - integrado a dados reais de instrumentos e categorias;
- `calibrações e resultados`
  - tabelas expostas no schema, mas ainda não ligadas à interface principal.

## Variáveis de Ambiente

O projeto usa as seguintes variáveis em `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Como Rodar

### Pré-requisitos

- Node.js
- npm

### Instalação

```bash
npm install
```

### Ambiente

Configure o arquivo `.env` com as credenciais do Supabase usadas pelo projeto.

### Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Produção local

```bash
npm run start
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Documentação do Projeto

- [CONTEXT.md](/c:/Metrologia/CONTEXT.md)
- [LOGS.md](/c:/Metrologia/LOGS.md)
- [PRD_Metrologia.md](/c:/Metrologia/PRD_Metrologia.md)

## Observações

- O projeto usa múltiplos schemas no Supabase e as consultas precisam respeitar o schema correto.
- As regras de serialização e exibição de medidas ficam centralizadas em `lib/measurements.ts`.
- As regras de categorias ficam centralizadas em `lib/categories.ts`.
- As regras de instrumentos, prazo e apresentação ficam em `lib/instruments.ts`.
- A consolidação dos números do dashboard fica em `lib/dashboard-metrics.ts`.
