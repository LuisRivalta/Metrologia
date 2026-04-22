# B2 — Calibration Flow UX: Inline Validation

**Data:** 2026-04-18
**Abordagem:** Validação inline + reordenação de seções (página única, sem wizard)
**Meta:** Eliminar erros de submit confusos no fluxo de nova calibração — especialmente PDF não anexado

---

## Contexto

O componente `app/_components/instrument-calibration-create-content.tsx` tem ~900 linhas e concentra todo o fluxo de criação de calibração. A dor reportada: usuário avançado não sabe que errou (especialmente no PDF) até tentar enviar — e o erro aparece longe do campo problemático.

Abordagem escolhida: manter página única (wizard seria burocrático para usuário avançado), mas adicionar validação imediata e erros inline por campo.

---

## O que muda

### 1. PDF sobe para o topo

O bloco de upload de arquivo passa a ser a primeira seção visível do formulário — acima de "Responsável", datas e campos de medição.

Label: `Certificado (obrigatório)` com instrução de formato/tamanho visível.

### 2. Validação imediata no upload

Ao selecionar arquivo via input:
- Valida extensão (`.pdf`) e tamanho (≤ 10 MB) imediatamente no `onChange`
- Se inválido → `fileError` preenchido, mensagem vermelha inline abaixo do input, arquivo rejeitado
- Se válido → preview do nome aparece, botão "Extrair com IA" fica disponível

### 3. Erros inline no submit

Cada campo obrigatório recebe uma `ref` e uma variável de erro dedicada. Ao submeter com campos faltando:
- Borda vermelha + mensagem inline abaixo de cada campo com problema
- `window.scrollTo` até o primeiro campo com erro
- O alert/toast genérico de erro é removido (mantido apenas como fallback de erro de rede/servidor)

### 4. Estados de erro por campo (novos `useState`)

```ts
const [fileError, setFileError] = useState<string | null>(null);
const [responsibleError, setResponsibleError] = useState<string | null>(null);
const [calibrationDateError, setCalibrationDateError] = useState<string | null>(null);
const [validityDateError, setValidityDateError] = useState<string | null>(null);
```

---

## O que não muda

- Nenhuma rota de API nova ou alterada
- Nenhum arquivo em `lib/` alterado
- Lógica de extração por IA (botão manual, mesmo pipeline)
- Checkbox de conformidade de página (comportamento no submit idêntico)
- Estrutura de dados salva no banco (payload `observacoes`, `calibracao_resultados`)

---

## Fora de escopo

- Conformidade por campo individual (seria B2b — outro ciclo de brainstorm)
- Reorganização estrutural do componente de 900 linhas
- Derivação automática de `validityDate` a partir do intervalo de calibração

---

## Validação das mudanças

**Manual (golden path):**
1. Upload de PDF inválido (`.jpg`, arquivo > 10 MB) → erro inline imediato
2. Upload de PDF válido → erro some, botão de extração aparece
3. Submit sem PDF → scroll até campo de arquivo + mensagem vermelha
4. Submit sem "Responsável" → scroll até esse campo
5. Fluxo completo (PDF + campos + submit) sem regressão

**Automatizado:**
- `npm run test` — nenhuma lógica em `lib/` foi alterada, suite deve passar
- `npm run build` — valida tipos do componente

---

## Arquivo principal

`app/_components/instrument-calibration-create-content.tsx`
