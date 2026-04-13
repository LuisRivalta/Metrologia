# Logs do Projeto

## 2026-04-07

### O que foi feito
- Refinada a tela de login com foco visual e organizacao do layout.
- Integrado o componente `LightPillar` como fundo visual da pagina de login.
- Integrado o componente `ShinyText` no titulo "Metrologia Pro".
- Integrado o componente `BorderGlow` no card de login.
- Removidos textos auxiliares desnecessarios do login para deixar a composicao mais limpa.
- Corrigidos erros ortograficos visiveis na pagina de login.
- Implementado feedback de validacao no login com shake no botao e mensagem inline em vermelho.
- Atualizada a documentacao principal do projeto.

### Alteracoes
- Criado o componente [border-glow.tsx](/c:/Metrologia/app/_components/border-glow.tsx).
- Criado o stylesheet [border-glow.module.css](/c:/Metrologia/app/_components/border-glow.module.css).
- Ajustado o componente [light-pillar.tsx](/c:/Metrologia/app/_components/light-pillar.tsx) na composicao da tela de login.
- Ajustado o componente [shiny-text.tsx](/c:/Metrologia/app/_components/shiny-text.tsx) para manter o texto visivel com brilho sobreposto.
- Atualizada a pagina [page.tsx](/c:/Metrologia/app/login/page.tsx) com nova composicao visual e validacao do formulario.
- Atualizado o arquivo [globals.css](/c:/Metrologia/app/globals.css) com estilos de login, shake e ajustes de layout.
- Revisados [CONTEXT.md](/c:/Metrologia/CONTEXT.md), [LOGS.md](/c:/Metrologia/LOGS.md) e [README.md](/c:/Metrologia/README.md).

### Problemas encontrados
- O efeito do `ShinyText` inicialmente apagava o texto em vez de apenas gerar o brilho.
- O `LightPillar` nao ficou igual ao exemplo original quando inserido em um contexto de layout diferente.
- O `BorderGlow` precisou ser adaptado ao card existente do login.
- Parte da documentacao e de alguns textos apresentava codificacao quebrada.
- A validacao nativa do formulario nao entregava o feedback visual desejado para o login.

### Solucoes aplicadas
- O `ShinyText` foi ajustado para trabalhar com uma base de texto fixa e uma camada separada de brilho.
- O `LightPillar` foi reposicionado e reconfigurado para funcionar como fundo do hero de login.
- O `BorderGlow` foi integrado como wrapper do card, preservando o conteudo interno.
- A validacao do login passou a usar `checkValidity()` com mensagem inline e animacao de negacao.
- A documentacao principal foi reescrita com texto limpo e atualizado.

### Observacoes
- Nao houve alteracao de banco nesta etapa.
- O foco do dia ficou concentrado em experiencia de login, efeitos visuais e organizacao da documentacao.
- O projeto segue usando o schema `calibracao` como base principal de persistencia.

## 2026-04-06

### O que foi feito
- Estruturado o dashboard inicial com base em informacoes reais do projeto.
- Conectadas categorias reais e instrumentos reais ao sistema.
- Criada a pagina individual de detalhe por instrumento.
- Implementada a persistencia real de categorias, medidas e instrumentos.
- Estruturados os campos de medicao por instrumento.
- Melhorada a pagina de configuracoes com recurso de acessibilidade para fonte.
- Criados os arquivos de documentacao do projeto.

### Alteracoes
- Criadas e ajustadas rotas API para categorias, medidas e instrumentos.
- Atualizados mapeadores em `lib/` para suportar serializacao amigavel e leitura real do banco.
- Refeito o dashboard para usar metricas e alertas pertinentes a metrologia.
- Ajustada a tela de instrumentos para trabalhar com banco em vez de mocks e `localStorage`.
- Ajustada a tela de login com novo layout base.

### Problemas encontrados
- Permissao insuficiente inicialmente na tabela `calibracao.categorias_instrumentos`.
- Valor de `tag` armazenado em formato inadequado antes da mudanca para `text`.
- Divergencias entre exibicao amigavel e formato tecnico salvo no banco.
- Comportamentos visuais incoerentes em alguns cards do dashboard.

### Solucoes aplicadas
- Liberado o acesso correto a `categorias_instrumentos`.
- Ajustado o fluxo para `tag` manual.
- Centralizada a conversao entre formato tecnico e visual em funcoes de apoio.
- Refinado o layout do dashboard e da pagina de detalhe do instrumento.

### Observacoes
- A base real do schema `calibracao` passou a ser a fonte principal da aplicacao.
- O dashboard ainda pode evoluir com mais dados operacionais no futuro.
