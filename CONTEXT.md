# Nome do Projeto
- Nome: Metrologia PRO
- Descricao curta: Sistema web para controle de instrumentos, categorias, unidades de medida, prazos de calibracao e operacao metrologica interna.

# Objetivo
- Resolver a organizacao e o acompanhamento de instrumentos de medicao e calibracao em um unico ambiente.
- Atender times internos responsaveis por metrologia, controle tecnico, qualidade e auditoria.
- Entregar rastreabilidade operacional, padronizacao cadastral e visualizacao rapida do status dos instrumentos.

# Regras de Negocio
- Categorias e unidades de medida sao mantidas no schema `calibracao`.
- O nome salvo no banco pode seguir formato tecnico/canonico, enquanto a interface exibe uma versao amigavel ao usuario.
- Cada categoria pode possuir campos de medicao padrao.
- Ao selecionar uma categoria no cadastro de instrumento, os campos padrao devem ser carregados automaticamente.
- O usuario pode adicionar campos extras manualmente em um instrumento, sem depender apenas do padrao da categoria.
- A `tag` do instrumento e digitada manualmente pelo usuario.
- O dashboard deve priorizar informacoes pertinentes a metrologia: total de instrumentos, total de categorias, prazos e distribuicao por status.
- Em regras de prazo, itens "perto de vencer" ainda contam como "no prazo" para o indice agregado.
- Exclusoes sensiveis devem passar por confirmacao explicita na interface.
- Alteracoes de banco so devem acontecer quando solicitadas explicitamente e apenas no schema `calibracao`.

# Arquitetura
- Tecnologias usadas:
  - Next.js App Router
  - React
  - TypeScript
  - Supabase
  - CSS global + CSS Modules
  - Three.js
  - Motion
- Estrutura de pastas:
  - `app/`: paginas, rotas API e componentes de interface
  - `app/_components/`: componentes reutilizaveis do sistema
  - `app/api/`: rotas server-side para integracao com Supabase
  - `lib/`: mapeadores, serializadores, metricas e clientes auxiliares
  - `public/`: assets estaticos
- Comunicacao entre modulos:
  - As telas usam componentes React na camada de UI.
  - As rotas em `app/api/` centralizam operacoes server-side no Supabase.
  - Os arquivos em `lib/` padronizam transformacoes, serializacao e leitura de dados.
  - O login usa Supabase Auth no cliente e componentes visuais dedicados para a experiencia da tela inicial.

# Integracoes
- APIs utilizadas:
  - Supabase Auth
  - Supabase PostgREST
- Servicos externos:
  - Banco Supabase
- Integracoes visuais locais:
  - `LightPillar` para efeito de fundo na tela de login
  - `ShinyText` para destaque visual do titulo principal
  - `BorderGlow` para glow interativo no card de login

# Banco de Dados
- Descricao geral:
  - O projeto trabalha principalmente com o schema `calibracao`.
  - A aplicacao consome tabelas reais para categorias, instrumentos, calibracoes e campos de medicao.
- Principais tabelas:
  - `calibracao.categorias_instrumentos`
  - `calibracao.unidadas_medidas`
  - `calibracao.instrumentos`
  - `calibracao.categoria_campos_medicao`
  - `calibracao.instrumento_campos_medicao`
  - `calibracao.calibracoes`
  - `calibracao.calibracao_resultados`

# Padroes e Convencoes
- Nomeacao:
  - Componentes React em PascalCase.
  - Helpers e utilitarios em arquivos de `lib/` com foco funcional.
  - Campos tecnicos do banco seguem o schema existente do projeto.
- Organizacao de codigo:
  - Componentes visuais reutilizaveis ficam em `app/_components`.
  - Regras de transformacao de dados ficam em `lib/`.
  - Acesso a banco server-side passa por rotas API ou funcoes server-side controladas.
- Boas praticas:
  - Preservar o formato canonico no banco quando necessario.
  - Priorizar exibicao amigavel na interface.
  - Evitar mocks quando ja existir tabela real disponivel.
  - Manter responsividade e suporte ao tema escuro nas telas principais.
  - Em fluxos de login, exibir feedback de erro direto e objetivo para o usuario.

# Status Atual
- Ja foi feito:
  - CRUD real de unidades de medida no schema `calibracao`
  - CRUD real de categorias em `calibracao.categorias_instrumentos`
  - CRUD real de instrumentos em `calibracao.instrumentos`
  - Pagina individual de detalhe por instrumento
  - Dashboard com metricas reais de instrumentos, categorias e status de prazo
  - Campos padrao por categoria e campos extras por instrumento
  - Melhorias visuais e de acessibilidade em configuracoes
  - Redesign da tela de login com layout full-screen
  - Integracao do fundo `LightPillar` no login
  - Integracao do `ShinyText` no titulo principal do hero
  - Integracao do `BorderGlow` no card de login
  - Validacao visual no login com shake do botao e mensagem inline de erro
  - Revisao ortografica dos principais textos da tela de login
- Em andamento:
  - Refinos visuais da tela de login
  - Ajustes finos de efeito visual no hero e no brilho do titulo
  - Evolucao da experiencia detalhada por instrumento
- Proximos passos:
  - Expandir historico detalhado de calibracoes por instrumento
  - Evoluir o dashboard com novas leituras reais da operacao metrologica
  - Padronizar ainda mais a documentacao tecnica e funcional
  - Continuar a limpeza visual e consistencia do fluxo de autenticacao
