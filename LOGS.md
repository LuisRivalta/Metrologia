# Logs do Projeto

## 2026-04-17

### O que foi feito
- Reescrita da documentacao principal com base no codigo atual do projeto.
- Atualizados `README.md`, `CONTEXT.md`, `PRD_Metrologia.md` e `TDD.md`.
- Criado `HANDOFF_IA.md` para onboarding tecnico de outra IA.
- Consolidado no texto o fluxo real de autenticacao, APIs internas, storage e extracao por IA.
- Registradas as regras operacionais mais importantes do dominio e os pontos de atencao para futuras alteracoes.

### Escopo documentado
- arquitetura do app
- paginas e rotas principais
- endpoints internos
- schemas e tabelas usados
- fluxo de cadastro de instrumento
- fluxo de cadastro de calibracao
- extracao assistida por IA
- regras derivadas de `Paquimetro`
- estrategia de testes

### Validacao
- `npm run test`
- `npm run build`

## 2026-04-13

### O que foi feito
- Consolidado o fluxo de categorias com template de calibracao por categoria.
- Ajustado o cadastro de instrumento para 2 etapas:
  - dados do instrumento
  - certificado e calibracao inicial
- Criada e refinada a tela de nova calibracao para instrumentos existentes.
- Removidos `numero do certificado` e `laboratorio` dos formularios de calibracao.
- O log passou a usar o nome do PDF como identificacao principal da calibracao.
- Integrada extracao assistida por IA via `OpenRouter`.
- Ajustada a leitura de PDF para usar o caminho nativo do modelo em vez do parser que falhava.
- Adicionado timeout para modelos `:free` da OpenRouter, evitando espera longa na UI.
- Implementadas regras derivadas para a categoria `Paquimetro`.
- Estruturada uma rotina de TDD com cobertura e scripts dedicados.
- Executado um ciclo TDD real em `lib/calibrations.ts`.

### Alteracoes
- Atualizados `app/_components/instrument-create-content.tsx` e `app/_components/instrument-calibration-create-content.tsx`.
- Atualizado o log em `app/_components/instrument-calibrations-content.tsx`.
- Atualizada a rota de extracao em `app/api/calibracoes/extrair/route.ts`.
- Atualizada a serializacao do historico em `lib/calibrations.ts`.
- Criado o helper de regras derivadas em `lib/calibration-derivations.ts`.
- Atualizados os principais arquivos de documentacao.

### Problemas encontrados
- Parser `cloudflare-ai` da OpenRouter falhando com `Failed to parse ...`.
- Modelo `nvidia/nemotron-nano-12b-v2-vl:free` demorando demais com PDF em alguns cenarios.
- Campos derivados de paquimetro exigiam conta automatica, mas a regra ainda nao existia no sistema.
- Parte da documentacao estava desatualizada.

### Solucoes aplicadas
- Remocao do parser forcado de PDF e uso do caminho nativo do modelo.
- Inclusao de timeout no backend para extracao com modelos `:free`.
- Calculo automatico de campos derivados por categoria no proprio sistema.
- Reorganizacao da documentacao principal.

## 2026-04-07

### O que foi feito
- Refinada a tela de login com foco visual e organizacao do layout.
- Integrado o componente `LightPillar` como fundo visual da pagina de login.
- Integrado o componente `ShinyText` no titulo `Metrologia Pro`.
- Integrado o componente `BorderGlow` no card de login.
- Implementado feedback de validacao no login com shake no botao e mensagem inline.

### Observacoes
- Nao houve alteracao de banco nesta etapa.
- O foco ficou concentrado em experiencia de login e identidade visual.

## 2026-04-06

### O que foi feito
- Estruturado o dashboard inicial com dados reais.
- Integradas categorias, medidas e instrumentos reais ao sistema.
- Criada a pagina individual de detalhe por instrumento.
- Ajustadas rotas e mapeadores para trabalhar com o schema `calibracao`.

### Observacoes
- O projeto passou a usar a base real como fonte principal da aplicacao.
