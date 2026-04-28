---
tags: [historico, plano, calibracao]
feature: B2 — Calibration Flow UX
data: 2026-04-18
---
# B2 — Calibration Flow UX: Inline Validation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar erros de submit confusos no fluxo de nova calibração — mover PDF para o topo, validar imediatamente no upload e remover o erro genérico de validação.

**Architecture:** Um único componente React é alterado (`instrument-calibration-create-content.tsx`). Nenhuma mudança em `lib/`, rotas de API ou banco. As três tarefas são independentes e podem ser feitas em qualquer ordem, mas a sequência abaixo minimiza o tamanho de cada diff.

**Tech Stack:** Next.js 15, React 19, TypeScript — sem dependências novas.

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| Modify | `app/_components/instrument-calibration-create-content.tsx` |

Nenhum arquivo novo criado. Nenhum arquivo em `lib/` alterado.

---

## Contexto do componente (leia antes de começar)

O componente `InstrumentCalibrationCreateContent` tem ~900 linhas. Os pontos relevantes para este plano:

- `handleFileChange` (linha ~325): handler do input de arquivo — **atualmente só limpa o erro, não valida**
- `validateForm` (linha ~277): valida todos os campos no submit — **atualmente define `nextErrors.form` para mensagem genérica**
- `scrollToFirstValidationIssue` (linha ~148): já existe e já funciona — scroll até `.is-invalid` ou `.instrument-modal__field-error`
- Seção de upload (linha ~711–781): bloco JSX do PDF — **atualmente fica depois do grid de datas**
- `maxCertificateFileSize` (linha 98): `10 * 1024 * 1024`
- `isPdfFile(file)` (linha ~194): já existe — verifica tipo MIME e extensão

---

## Task 1: Validação imediata do PDF no upload

**Files:**
- Modify: `app/_components/instrument-calibration-create-content.tsx` (função `handleFileChange`, linha ~325)

- [ ] **Step 1: Abrir o arquivo e localizar `handleFileChange`**

Abra `app/_components/instrument-calibration-create-content.tsx`. Localize a função `handleFileChange` (~linha 325). Ela tem esta aparência:

```tsx
function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
  const nextFile = event.target.files?.[0] ?? null;

  setFormState((current) => ({
    ...current,
    certificateFile: nextFile
  }));
  setFieldResults(
    applyCalibrationDerivedValues(
      getCalibrationCategoryIdentifier(instrument),
      createFieldReviewItems(instrument)
    )
  );
  setExtractionError("");
  setExtractionMessage("");
  setExtractionWarnings([]);
  setValidationErrors((current) => ({
    ...current,
    certificateFile: undefined,
    form: undefined
  }));
}
```

- [ ] **Step 2: Substituir `handleFileChange` pela versão com validação imediata**

Substitua a função inteira pela versão abaixo. Ela valida tipo e tamanho logo após definir o arquivo no estado — se inválido, mostra o erro instantaneamente sem esperar o submit:

```tsx
function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
  const nextFile = event.target.files?.[0] ?? null;

  setFormState((current) => ({
    ...current,
    certificateFile: nextFile
  }));
  setFieldResults(
    applyCalibrationDerivedValues(
      getCalibrationCategoryIdentifier(instrument),
      createFieldReviewItems(instrument)
    )
  );
  setExtractionError("");
  setExtractionMessage("");
  setExtractionWarnings([]);

  if (!nextFile) {
    setValidationErrors((current) => ({
      ...current,
      certificateFile: undefined,
      form: undefined
    }));
    return;
  }

  if (!isPdfFile(nextFile)) {
    setValidationErrors((current) => ({
      ...current,
      certificateFile: "O certificado deve estar no formato PDF.",
      form: undefined
    }));
    return;
  }

  if (nextFile.size > maxCertificateFileSize) {
    setValidationErrors((current) => ({
      ...current,
      certificateFile: "O certificado deve ter no maximo 10 MB.",
      form: undefined
    }));
    return;
  }

  setValidationErrors((current) => ({
    ...current,
    certificateFile: undefined,
    form: undefined
  }));
}
```

- [ ] **Step 3: Verificar que o build passa**

```bash
npm run build
```

Esperado: build sem erros de tipo. Warnings de lint existentes no projeto são aceitáveis desde que não sejam novos.

- [ ] **Step 4: Testar manualmente**

1. Abra `/instrumentos/<qualquer-id>/calibracoes/nova`
2. Selecione um arquivo `.jpg` — deve aparecer "O certificado deve estar no formato PDF." imediatamente abaixo do input, sem clicar em "Registrar"
3. Selecione um `.pdf` válido — o erro deve sumir imediatamente
4. Confirme que o botão "Extrair com IA" fica habilitado após PDF válido

- [ ] **Step 5: Commit**

```bash
git add app/_components/instrument-calibration-create-content.tsx
git commit -m "feat: validate PDF format and size immediately on file select"
```

---

## Task 2: Mover seção de PDF para o topo do formulário

**Files:**
- Modify: `app/_components/instrument-calibration-create-content.tsx` (JSX do `<form>`, linhas ~577–893)

- [ ] **Step 1: Localizar a estrutura do `<form>`**

Dentro do `<form className="instrument-calibration-form" onSubmit={handleSubmit}>`, a ordem atual dos filhos é:

1. `<div className="instrument-calibration-form__grid">` — campos de texto (Status, Responsável, datas)
2. `<section className="instrument-calibration-upload"...>` — upload do PDF
3. `<section className="instrument-calibration-review">` — tabela de campos
4. `<label ... instrument-modal__field--full>` — Observações
5. `{validationErrors.form ? ...}` — erro genérico
6. `<footer>` — botões

- [ ] **Step 2: Reordenar — PDF sobe para antes do grid de datas**

Mova o bloco `<section className={`instrument-calibration-upload...`}>` (que vai da abertura da section até o `</section>` que fecha o bloco de upload, antes da section de review) para ser o **primeiro filho** do `<form>`, antes do `<div className="instrument-calibration-form__grid">`.

A ordem dos filhos do `<form>` deve ficar:

```tsx
<form className="instrument-calibration-form" onSubmit={handleSubmit}>
  {/* 1. PDF — primeiro, obrigatório */}
  <section
    className={`instrument-calibration-upload${
      validationErrors.certificateFile ? " is-invalid" : ""
    }`}
  >
    <div className="instrument-calibration-upload__copy">
      <strong>Certificado em PDF</strong>
      <p>Envie o arquivo oficial para manter o historico de auditoria vinculado ao instrumento. O nome do PDF sera usado no log.</p>
    </div>

    <input
      type="file"
      accept="application/pdf,.pdf"
      onChange={handleFileChange}
    />

    {selectedFileLabel ? (
      <div className="instrument-calibration-upload__file">
        <span>{selectedFileLabel}</span>
        <button
          type="button"
          onClick={() => {
            setFormState((current) => ({
              ...current,
              certificateFile: null
            }));
            setFieldResults(createFieldReviewItems(instrument));
            setExtractionError("");
            setExtractionMessage("");
            setExtractionWarnings([]);
            setValidationErrors((current) => ({
              ...current,
              certificateFile: undefined,
              form: undefined
            }));
          }}
        >
          Remover arquivo
        </button>
      </div>
    ) : null}

    <div className="instrument-calibration-upload__actions">
      <button
        type="button"
        className="instrument-calibration-upload__extract"
        onClick={handleExtractWithAi}
        disabled={!formState.certificateFile || isExtracting || isSubmitting}
      >
        {isExtracting ? "Lendo certificado..." : "Extrair com IA"}
      </button>
    </div>

    {validationErrors.certificateFile ? (
      <p className="instrument-modal__field-error">
        {validationErrors.certificateFile}
      </p>
    ) : (
      <p className="instrument-calibration-upload__hint">
        Arquivo unico em PDF com ate 10 MB.
      </p>
    )}

    {extractionError ? (
      <p className="instrument-modal__field-error">{extractionError}</p>
    ) : null}

    {extractionMessage ? (
      <p className="instrument-calibration-upload__success">{extractionMessage}</p>
    ) : null}
  </section>

  {/* 2. Campos de cabeçalho */}
  <div className="instrument-calibration-form__grid">
    {/* ... conteúdo existente do grid sem alteração ... */}
  </div>

  {/* 3. Tabela de medição — sem alteração */}
  <section className="instrument-calibration-review">
    {/* ... */}
  </section>

  {/* 4. Observações — sem alteração */}
  <label className="instrument-modal__field instrument-modal__field--full">
    {/* ... */}
  </label>

  {/* 5. Erro de servidor + footer — sem alteração */}
  {validationErrors.form ? (
    <p className="instrument-modal__field-error">{validationErrors.form}</p>
  ) : null}

  <footer className="instrument-calibration-form__footer">
    {/* ... */}
  </footer>
</form>
```

**Atenção:** mova o bloco JSX existente exatamente como está — não reescreva. Apenas corte e cole para a nova posição.

- [ ] **Step 3: Verificar que o build passa**

```bash
npm run build
```

Esperado: build limpo, sem erros de tipo.

- [ ] **Step 4: Testar manualmente**

1. Abra `/instrumentos/<qualquer-id>/calibracoes/nova`
2. Confirme que a seção "Certificado em PDF" aparece **antes** dos campos de Responsável e datas
3. Confirme que a extração por IA ainda funciona após upload de PDF válido
4. Confirme que o fluxo completo (PDF + campos + submit) ainda salva corretamente

- [ ] **Step 5: Commit**

```bash
git add app/_components/instrument-calibration-create-content.tsx
git commit -m "feat: move PDF upload section to top of calibration form"
```

---

## Task 3: Remover erro genérico de validação de campo

**Files:**
- Modify: `app/_components/instrument-calibration-create-content.tsx` (função `validateForm`, linha ~277)

**Contexto:** Atualmente, quando `validateForm` encontra campos inválidos, ele define `nextErrors.form = "Revise os campos obrigatorios acima..."`. Isso gera uma segunda mensagem de erro genérica no rodapé da tela, além das mensagens inline já presentes em cada campo. Como `scrollToFirstValidationIssue` já leva o usuário ao primeiro campo com problema, a mensagem genérica é redundante. Mantemos `validationErrors.form` apenas para erros de servidor (falhas de rede, resposta de erro da API).

- [ ] **Step 1: Localizar o trecho em `validateForm` que define o erro genérico**

Dentro de `validateForm`, localize estas linhas (~linha 317):

```tsx
if (Object.keys(nextErrors).length > 0) {
  nextErrors.form = "Revise os campos obrigatorios acima antes de salvar.";
}
```

- [ ] **Step 2: Remover o bloco**

Delete as 3 linhas acima. O final da função deve ficar:

```tsx
setValidationErrors(nextErrors);
return Object.keys(nextErrors).filter((key) => key !== "form").length === 0;
```

Nenhuma outra mudança. O `validationErrors.form` ainda é usado pelos blocos `catch` de `handleSubmit` para erros de servidor — não toque neles.

- [ ] **Step 3: Verificar que o build passa**

```bash
npm run build
```

Esperado: build limpo.

- [ ] **Step 4: Testar manualmente**

1. Abra `/instrumentos/<qualquer-id>/calibracoes/nova`
2. Clique em "Registrar calibracao" sem preencher nada
3. Confirme: erros aparecem inline em cada campo obrigatório, scroll vai até o primeiro campo com problema
4. Confirme: **não** aparece a mensagem genérica "Revise os campos obrigatorios..." no rodapé
5. Preencha tudo e simule falha de rede (desconecte a internet e tente salvar) — o erro genérico ainda deve aparecer para falhas de servidor

- [ ] **Step 5: Rodar a suite completa**

```bash
npm run test
```

Esperado: 73 testes passando (nenhum arquivo de `lib/` foi alterado).

- [ ] **Step 6: Commit**

```bash
git add app/_components/instrument-calibration-create-content.tsx
git commit -m "feat: show inline field errors only, keep generic error for server failures"
```

---

## Validação final

- [ ] Fluxo completo: PDF inválido → erro imediato; PDF válido → extração funciona; submit sem campos → scroll correto; submit completo → salva e redireciona
- [ ] `npm run test` — 73 testes passando
- [ ] `npm run build` — build limpo
## Relacionado
- [[historico/specs/2026-04-18-b2-calibration-flow-design]] — spec desta feature
- [[componentes/calibration-create-flow]] — componente implementado
