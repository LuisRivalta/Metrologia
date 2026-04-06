# 📌 Nome do Projeto
- Nome: Metrologia PRO
- Descrição curta: Sistema web para gestão de instrumentos, medidas, categorias, prazos de calibração e conformidade metrológica.

# 🎯 Objetivo
- Qual problema resolve: substitui controles manuais em planilhas por uma aplicação web centralizada, auditável e orientada a prazo de calibração.
- Público-alvo: time de metrologia, qualidade, engenharia e áreas operacionais que consultam instrumentos e conformidade.
- Benefícios principais: centralização dos cadastros, padronização das categorias e medidas, rastreabilidade operacional e base pronta para auditoria.

# 🧠 Regras de Negócio
- A `tag` do instrumento é manual, obrigatória e deve ser única.
- Cada categoria pode ter campos de medição padrão.
- Ao selecionar uma categoria no modal de instrumento, os campos padrão da categoria são carregados automaticamente.
- O usuário pode criar uma nova categoria dentro do modal de instrumento e já definir seus campos padrão no mesmo fluxo.
- O instrumento pode receber campos extras sem alterar o padrão global da categoria.
- Medidas são persistidas em formato canônico no banco e exibidas em formato amigável na interface.
- O dashboard considera `perto de vencer` como item ainda dentro do prazo no indicador principal de conformidade.
- Os alertas do dashboard priorizam instrumentos vencidos mais antigos e, depois, os instrumentos mais próximos do vencimento.
- Ao excluir um instrumento, os campos específicos desse instrumento também devem ser removidos.
- A consulta de centro de custo é somente leitura e depende do código informado.

# 🏗️ Arquitetura
- Tecnologias usadas: Next.js 15, React 19, TypeScript, Supabase e CSS global em `app/globals.css`.
- Estrutura de pastas resumida: `app/`, `app/_components/`, `app/api/`, `lib/`, `public/`.
- Rotas principais: `/login`, `/dashboard`, `/instrumentos`, `/instrumentos/[id]`, `/categorias`, `/configuracoes`, `/configuracoes/medidas`.
- APIs internas atuais: `/api/medidas`, `/api/categorias`, `/api/instrumentos`, `/api/instrumentos/metadata`, `/api/centro-custo`.
- Como os módulos se comunicam:
- As páginas renderizam componentes de `app/_components`.
- Componentes cliente usam `fetch` para as rotas de `app/api`.
- As rotas usam `supabaseAdmin` para leitura e escrita server-side.
- O login usa `supabaseBrowser.auth`.
- O dashboard usa `lib/dashboard-metrics.ts` para consolidar dados reais do schema `calibracao`.
- A lógica de serialização, mapeamento e transformação fica concentrada em `lib/`.

# 🔌 Integrações
- APIs utilizadas: rotas internas do Next.js para medidas, categorias, instrumentos, metadados de instrumentos e centro de custo.
- Serviços externos: Supabase Auth e Supabase Database.
- Schemas consultados atualmente: `calibracao` e `datasul`.
- Integrações em uso:
- `calibracao.unidadas_medidas`
- `calibracao.categorias_instrumentos`
- `calibracao.instrumentos`
- `calibracao.categoria_campos_medicao`
- `calibracao.instrumento_campos_medicao`
- `datasul.centro_custo`

# 🗄️ Banco de Dados
- Descrição geral: o projeto usa Supabase com múltiplos schemas; o módulo principal grava dados no schema `calibracao`.
- Principais tabelas já integradas:
- `calibracao.unidadas_medidas`: cadastro de unidades e tipos de medida.
- `calibracao.categorias_instrumentos`: categorias técnicas de instrumentos com `nome` e `slug`.
- `calibracao.instrumentos`: cadastro principal de instrumentos.
- `calibracao.categoria_campos_medicao`: campos padrão por categoria.
- `calibracao.instrumento_campos_medicao`: campos efetivos por instrumento.
- `datasul.centro_custo`: consulta de centro de custo por código.
- Tabelas já expostas, mas ainda não ligadas ao fluxo principal da interface: `calibracao.calibracoes` e `calibracao.calibracao_resultados`.

# ⚙️ Padrões e Convenções
- Nomeação: `slug` para identificadores técnicos, `nome` para exibição e `tag` como identificador operacional digitado pelo usuário.
- Organização de código: componentes visuais em `app/_components`, regras de negócio e mapeamentos em `lib`, integração com banco em `app/api`.
- Padrão de acesso ao banco: consultas e mutações server-side via `supabaseAdmin.schema(...)`.
- Padrão visual: layout compartilhado via `ManagementShell`, tema claro/escuro e estilos centralizados em `app/globals.css`.
- Boas práticas adotadas: validação de payloads, normalização antes de persistir, tipagem dos retornos, tratamento explícito de erros e rotas dinâmicas com `force-dynamic` quando necessário.

# 🚧 Status Atual
- O que já foi feito:
- CRUD real de medidas integrado ao Supabase.
- CRUD real de categorias integrado ao Supabase.
- CRUD real de instrumentos integrado ao schema `calibracao`.
- Página individual de detalhe por instrumento em `/instrumentos/[id]`.
- Modal de instrumento com carregamento de campos padrão por categoria.
- Fluxo de criação de nova categoria dentro do modal de instrumento.
- Dashboard conectado a dados reais de instrumentos e categorias.
- Tela de login redesenhada.
- Ajustes de acessibilidade em configurações para tamanho de fonte.
- Confirmações de exclusão aplicadas onde o fluxo exige maior segurança.
- O que está em andamento:
- Refinos visuais de dashboard, login e detalhe de instrumento.
- Evolução do histórico técnico do instrumento.
- Consolidação da documentação funcional e técnica.
- Próximos passos:
- Integrar histórico de calibrações e resultados na página individual do instrumento.
- Implementar fluxo de certificados previsto no PRD.
- Evoluir alertas automáticos de vencimento.
- Adicionar trilha de auditoria e relatórios operacionais.
