# 🧾 Logs do Projeto

## 📅 2026-04-06

### ✅ O que foi feito
- Conectado o módulo de instrumentos ao banco real no schema `calibracao`, removendo a dependência de mocks e `localStorage`.
- Implementado CRUD real de instrumentos com `GET`, `POST`, `PATCH` e `DELETE`.
- Ajustado o fluxo para `tag` manual digitada pelo usuário, com validação de duplicidade.
- Criada a página individual de detalhe do instrumento em `/instrumentos/[id]`.
- Implementado o carregamento automático de campos padrão por categoria no modal de instrumento.
- Permitida a criação de nova categoria diretamente no modal de instrumento, com definição dos campos padrão no mesmo fluxo.
- Integrado o dashboard a dados reais de instrumentos e categorias.
- Redesenhada a tela de login para um layout mais cenográfico, com card destacado e composição visual própria.
- Refinados dark mode, espaçamentos e cards da página de detalhe do instrumento.
- Atualizada a documentação principal do projeto.

### 🛠️ Alterações
- Criada a rota [app/api/instrumentos/route.ts](/c:/Metrologia/app/api/instrumentos/route.ts).
- Criada a rota [app/api/instrumentos/metadata/route.ts](/c:/Metrologia/app/api/instrumentos/metadata/route.ts).
- Criado o suporte de campos de medição em [lib/measurement-fields.ts](/c:/Metrologia/lib/measurement-fields.ts).
- Atualizada a modelagem de instrumentos em [lib/instruments.ts](/c:/Metrologia/lib/instruments.ts).
- Atualizado o cálculo do dashboard em [lib/dashboard-metrics.ts](/c:/Metrologia/lib/dashboard-metrics.ts).
- Evoluído o modal e a listagem em [app/_components/instruments-content.tsx](/c:/Metrologia/app/_components/instruments-content.tsx).
- Criada a página de detalhe em [app/instrumentos/[id]/page.tsx](/c:/Metrologia/app/instrumentos/[id]/page.tsx).
- Criado o componente [app/_components/instrument-detail-content.tsx](/c:/Metrologia/app/_components/instrument-detail-content.tsx).
- Redesenhada a tela [app/login/page.tsx](/c:/Metrologia/app/login/page.tsx).
- Ajustados estilos globais em [app/globals.css](/c:/Metrologia/app/globals.css).
- Sincronizados os documentos [CONTEXT.md](/c:/Metrologia/CONTEXT.md) e [README.md](/c:/Metrologia/README.md).

### 🐛 Problemas encontrados
- O módulo de instrumentos ainda recriava dados após reload por depender de dados locais.
- A coluna `tag` estava incompatível com o uso operacional até a mudança do tipo para texto.
- O dashboard e o gráfico de conformidade estavam inconsistentes com os dados exibidos.
- O layout da página de detalhe tinha áreas vazias e cards desbalanceados.
- A tela de login antiga não seguia a direção visual desejada.
- Houve necessidade de alinhar permissões e schema correto nas consultas do Supabase ao longo do dia.

### 💡 Soluções aplicadas
- Migração do fluxo de instrumentos para APIs reais ligadas a `calibracao.instrumentos`.
- Tratamento de `tag` como valor operacional manual com validação no backend.
- Consolidação dos campos padrão por categoria em `calibracao.categoria_campos_medicao`.
- Persistência dos campos por instrumento em `calibracao.instrumento_campos_medicao`.
- Reorganização da página de detalhe para leitura mais compacta e objetiva.
- Reescrita do layout da tela de login mantendo a autenticação existente.
- Atualização do dashboard para contagem real de instrumentos, categorias, alertas e status.

### 📌 Observações
- O módulo principal já opera com dados reais para medidas, categorias e instrumentos.
- O schema `calibracao` já expõe tabelas de calibração e resultados, mas elas ainda não foram ligadas à interface atual.
- A consulta de centro de custo continua dependente do schema `datasul` e permanece como integração de apoio.
- O PRD continua válido como visão de produto; as entregas de hoje avançaram principalmente a Fase 1 e a base visual do sistema.
