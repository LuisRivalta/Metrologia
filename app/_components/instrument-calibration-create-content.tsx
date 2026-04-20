"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api/client";
import {
  applyCalibrationDerivedValues,
  isAutoCalculatedCalibrationField
} from "@/lib/calibration-derivations";
import {
  calibrationStatusOptions,
  type CalibrationHistoryItem
} from "@/lib/calibrations";
import type { InstrumentDetailItem } from "@/lib/instruments";
import { CalibrationFieldReviewTable } from "./calibration-field-review-table";
import { PageTransitionLink } from "./page-transition-link";

type InstrumentCalibrationCreateContentProps = {
  instrumentId: number;
};

type InstrumentApiResponse = {
  error?: string;
  item?: InstrumentDetailItem;
};

type CalibrationCreateApiResponse = {
  error?: string;
  item?: CalibrationHistoryItem;
};

type CalibrationExtractionFieldItem = {
  fieldId: number;
  fieldSlug: string;
  fieldName: string;
  measurementName: string;
  value: string | null;
  unit: string | null;
  conforme: boolean | null;
  confidence: number | null;
  evidence: string | null;
};

type CalibrationExtractionApiResponse = {
  error?: string;
  extraction?: {
    header: {
      responsible: string | null;
      calibrationDate: string | null;
      certificateDate: string | null;
      validityDate: string | null;
      observations: string | null;
    };
    fields: CalibrationExtractionFieldItem[];
    warnings: string[];
  };
};

type CalibrationCreateFormState = {
  responsible: string;
  status: (typeof calibrationStatusOptions)[number]["value"];
  calibrationDate: string;
  certificateDate: string;
  validityDate: string;
  observations: string;
  certificateFile: File | null;
};

type CalibrationFieldReviewStatus = "unknown" | "conforming" | "non_conforming";

type CalibrationFieldReviewItem = {
  fieldId: number;
  fieldSlug: string;
  fieldName: string;
  measurementName: string;
  groupName: string;
  subgroupName: string;
  value: string;
  unit: string;
  confidence: number | null;
  evidence: string;
  status: CalibrationFieldReviewStatus;
};

type CalibrationCreateValidationErrors = Partial<
  Record<
    | "responsible"
    | "status"
    | "calibrationDate"
    | "certificateDate"
    | "validityDate"
    | "certificateFile"
    | "form",
    string
  >
>;

const maxCertificateFileSize = 10 * 1024 * 1024;

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyFormState(): CalibrationCreateFormState {
  const today = getTodayIsoDate();

  return {
    responsible: "",
    status: calibrationStatusOptions[0].value,
    calibrationDate: today,
    certificateDate: today,
    validityDate: "",
    observations: "",
    certificateFile: null
  };
}

function createFieldReviewItems(item: InstrumentDetailItem | null): CalibrationFieldReviewItem[] {
  if (!item) {
    return [];
  }

  return item.fields
    .filter((field): field is typeof field & { dbId: number } => typeof field.dbId === "number")
    .map((field) => ({
      fieldId: field.dbId,
      fieldSlug: field.slug,
      fieldName: field.name,
      measurementName: field.measurementName || field.measurementRawName || "",
      groupName: field.groupName ?? "",
      subgroupName: field.subgroupName ?? "",
      value: "",
      unit: "",
      confidence: null,
      evidence: "",
      status: "unknown"
    }));
}

function formatFileSize(fileSize: number) {
  if (fileSize >= 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(fileSize / 1024)} KB`;
}

function scrollToFirstValidationIssue() {
  if (typeof window === "undefined") {
    return;
  }

  window.requestAnimationFrame(() => {
    const firstIssue = document.querySelector(".is-invalid, .instrument-modal__field-error");

    if (!(firstIssue instanceof HTMLElement)) {
      return;
    }

    firstIssue.scrollIntoView({ behavior: "smooth", block: "center" });

    if (
      firstIssue instanceof HTMLInputElement ||
      firstIssue instanceof HTMLSelectElement ||
      firstIssue instanceof HTMLTextAreaElement
    ) {
      firstIssue.focus();
    }
  });
}

function getCalibrationStatusLabel(tone: InstrumentDetailItem["tone"]) {
  if (tone === "danger") return "Vencido";
  if (tone === "warning") return "Perto de vencer";
  return "No prazo";
}

function formatCalibrationSummaryDate(value: string | null | undefined) {
  const normalizedValue = value?.trim() ?? "";

  if (!normalizedValue) {
    return "Sem prazo";
  }

  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return normalizedValue;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year.slice(-2)}`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function getCalibrationCategoryIdentifier(item: InstrumentDetailItem | null) {
  return item?.categorySlug || item?.category || "";
}

export function InstrumentCalibrationCreateContent({
  instrumentId
}: InstrumentCalibrationCreateContentProps) {
  const router = useRouter();
  const [instrument, setInstrument] = useState<InstrumentDetailItem | null>(null);
  const [formState, setFormState] = useState<CalibrationCreateFormState>(() =>
    createEmptyFormState()
  );
  const [fieldResults, setFieldResults] = useState<CalibrationFieldReviewItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<CalibrationCreateValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPageConformityChecked, setIsPageConformityChecked] = useState(false);
  const [extractionError, setExtractionError] = useState("");
  const [extractionMessage, setExtractionMessage] = useState("");
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadInstrumentDetail() {
      setIsLoading(true);

      try {
        const response = await fetchApi(`/api/instrumentos?id=${instrumentId}`, {
          method: "GET",
          cache: "no-store"
        });
        const payload = (await response.json()) as InstrumentApiResponse;

        if (!response.ok || !payload.item) {
          if (!isMounted) return;
          setInstrument(null);
          setFieldResults([]);
          setLoadError(payload.error ?? "Nao foi possivel carregar o instrumento.");
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;
        setInstrument(payload.item);
        setFieldResults(
          applyCalibrationDerivedValues(
            getCalibrationCategoryIdentifier(payload.item),
            createFieldReviewItems(payload.item)
          )
        );
        setLoadError("");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setInstrument(null);
        setFieldResults([]);
        setLoadError("Nao foi possivel carregar o instrumento.");
        setIsLoading(false);
      }
    }

    void loadInstrumentDetail();

    return () => {
      isMounted = false;
    };
  }, [instrumentId]);

  const selectedFileLabel = useMemo(() => {
    if (!formState.certificateFile) {
      return "";
    }

    return `${formState.certificateFile.name} (${formatFileSize(formState.certificateFile.size)})`;
  }, [formState.certificateFile]);

  function validateForm() {
    const nextErrors: CalibrationCreateValidationErrors = {};

    if (!formState.responsible.trim()) {
      nextErrors.responsible = "Responsavel obrigatorio.";
    }

    if (!formState.status) {
      nextErrors.status = "Status geral obrigatorio.";
    }

    if (!formState.calibrationDate) {
      nextErrors.calibrationDate = "Data da calibracao obrigatoria.";
    }

    if (!formState.certificateDate) {
      nextErrors.certificateDate = "Data de emissao do certificado obrigatoria.";
    }

    if (!formState.validityDate) {
      nextErrors.validityDate = "Data da proxima calibracao obrigatoria.";
    }

    if (
      formState.calibrationDate &&
      formState.validityDate &&
      formState.validityDate < formState.calibrationDate
    ) {
      nextErrors.validityDate =
        "A data da proxima calibracao nao pode ser menor que a data da calibracao.";
    }

    if (!formState.certificateFile) {
      nextErrors.certificateFile = "Envie o certificado em PDF.";
    } else if (!isPdfFile(formState.certificateFile)) {
      nextErrors.certificateFile = "O certificado deve estar no formato PDF.";
    } else if (formState.certificateFile.size > maxCertificateFileSize) {
      nextErrors.certificateFile = "O certificado deve ter no maximo 10 MB.";
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).filter((key) => key !== "form").length === 0;
  }

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

  async function handleExtractWithAi() {
    if (!formState.certificateFile || !instrument) {
      return;
    }

    setIsExtracting(true);
    setExtractionError("");
    setExtractionMessage("");
    setExtractionWarnings([]);

    const extractionAbortController = new AbortController();
    const extractionTimeoutId = window.setTimeout(
      () => extractionAbortController.abort(),
      75_000
    );

    try {
      const payload = new FormData();
      payload.set("instrumentId", String(instrumentId));
      payload.set("certificateFile", formState.certificateFile);

      const response = await fetchApi("/api/calibracoes/extrair", {
        method: "POST",
        body: payload,
        signal: extractionAbortController.signal
      });
      const responsePayload = (await response.json()) as CalibrationExtractionApiResponse;

      if (!response.ok || !responsePayload.extraction) {
        setExtractionError(responsePayload.error ?? "Nao foi possivel ler o certificado com a IA.");
        setIsExtracting(false);
        return;
      }

      setFormState((current) => ({
        ...current,
        responsible: responsePayload.extraction?.header.responsible ?? current.responsible,
        calibrationDate:
          responsePayload.extraction?.header.calibrationDate ?? current.calibrationDate,
        certificateDate:
          responsePayload.extraction?.header.certificateDate ?? current.certificateDate,
        validityDate: responsePayload.extraction?.header.validityDate ?? current.validityDate,
        observations: responsePayload.extraction?.header.observations ?? current.observations
      }));
      setFieldResults((current) =>
        applyCalibrationDerivedValues(
          getCalibrationCategoryIdentifier(instrument),
          current.map((field) => {
          const extractedField = responsePayload.extraction?.fields.find(
            (item) => item.fieldId === field.fieldId
          );

          if (!extractedField) {
            return field;
          }

          return {
            ...field,
            value: extractedField.value ?? "",
            unit: extractedField.unit ?? "",
            confidence: extractedField.confidence,
            evidence: extractedField.evidence ?? "",
            status:
              extractedField.conforme === true
                ? "conforming"
                : "unknown"
          };
          })
        )
      );
      setExtractionWarnings(responsePayload.extraction.warnings);
      setExtractionMessage(
        "Leitura concluida. Revise os dados sugeridos pela IA antes de registrar a calibracao."
      );
      setValidationErrors((current) => ({
        ...current,
        responsible: undefined,
        calibrationDate: undefined,
        certificateDate: undefined,
        validityDate: undefined,
        form: undefined
      }));
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      setExtractionError(
        isAbort
          ? "A leitura demorou mais do que o esperado. Tente novamente."
          : "Nao foi possivel ler o certificado com a IA."
      );
    } finally {
      window.clearTimeout(extractionTimeoutId);
      setIsExtracting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      scrollToFirstValidationIssue();
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.set("instrumentId", String(instrumentId));
      payload.set("responsible", formState.responsible.trim());
      payload.set("status", formState.status);
      payload.set("calibrationDate", formState.calibrationDate);
      payload.set("certificateDate", formState.certificateDate);
      payload.set("validityDate", formState.validityDate);
      payload.set("observations", formState.observations.trim());
      payload.set(
        "resultsJson",
        JSON.stringify(
          fieldResults.map((field) => ({
            fieldId: field.fieldId,
            fieldSlug: field.fieldSlug,
            fieldName: field.fieldName,
            measurementName: field.measurementName,
            value: field.value,
            unit: field.unit,
            confidence: field.confidence,
            evidence: field.evidence,
            status: isPageConformityChecked ? "conforming" : "unknown"
          }))
        )
      );

      if (formState.certificateFile) {
        payload.set("certificateFile", formState.certificateFile);
      }

      const response = await fetchApi("/api/calibracoes", {
        method: "POST",
        body: payload
      });
      const responsePayload = (await response.json()) as CalibrationCreateApiResponse;

      if (!response.ok || !responsePayload.item) {
        setValidationErrors({
          form: responsePayload.error ?? "Nao foi possivel registrar a calibracao."
        });
        setIsSubmitting(false);
        return;
      }

      router.push(`/instrumentos/${instrumentId}/calibracoes?created=1`);
    } catch {
      setValidationErrors({
        form: "Nao foi possivel registrar a calibracao."
      });
      setIsSubmitting(false);
    }
  }

  return (
    <section className="inventory-content instrument-detail-content instrument-calibration-create-content">
      <div className="instrument-detail-nav instrument-detail-nav--split">
        <PageTransitionLink href={`/instrumentos/${instrumentId}`} className="instrument-detail-back">
          <span aria-hidden="true" className="instrument-detail-back__icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M14.5 6.5 9 12l5.5 5.5M10 12h8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Voltar para o instrumento
        </PageTransitionLink>

        <div className="instrument-detail-nav__actions">
          <PageTransitionLink
            href={`/instrumentos/${instrumentId}/calibracoes`}
            className="instrument-detail-link-chip"
          >
            Log de calibracoes
          </PageTransitionLink>
        </div>
      </div>

      {isLoading ? (
        <section className="inventory-table-card instrument-detail-card instrument-detail-card--state">
          <p className="inventory-table__empty">Carregando dados do instrumento...</p>
        </section>
      ) : null}

      {!isLoading && loadError ? (
        <section className="inventory-table-card instrument-detail-card instrument-detail-card--state">
          <p className="inventory-table__empty">{loadError}</p>
        </section>
      ) : null}

      {!isLoading && instrument ? (
        <section className="instrument-calibration-create-grid">
          <article className="inventory-table-card instrument-calibration-create-card instrument-calibration-create-card--single">
            <section className="instrument-calibration-create-overview">
              <div className="instrument-calibration-create-overview-top">
                <div className="instrument-calibration-create-card__copy">
                  <div className="instrument-calibration-card__heading">
                    <h2>{instrument.tag}</h2>
                  </div>
                  <p>{instrument.category}</p>
                </div>

                <div className="instrument-calibration-create-summary">
                  <div className="instrument-calibration-create-summary__item">
                    <span>Fabricante</span>
                    <strong>{instrument.manufacturer}</strong>
                  </div>
                  <div
                    className={`instrument-calibration-create-summary__item instrument-calibration-create-summary__item--status instrument-calibration-create-summary__item--${instrument.tone}`}
                  >
                    <span>Status atual</span>
                    <strong>{getCalibrationStatusLabel(instrument.tone)}</strong>
                  </div>
                  <div className="instrument-calibration-create-summary__item">
                    <span>Prazo atual</span>
                    <strong>{formatCalibrationSummaryDate(instrument.calibrationDateValue)}</strong>
                  </div>
                </div>
              </div>
            </section>

            <form className="instrument-calibration-form" onSubmit={handleSubmit}>
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

              <div className="instrument-calibration-form__grid">
                <label className="instrument-modal__field">
                  <span>Status geral</span>
                  <select
                    className={validationErrors.status ? "is-invalid" : undefined}
                    value={formState.status}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        status: event.target.value as CalibrationCreateFormState["status"]
                      }));
                      setValidationErrors((current) => ({
                        ...current,
                        status: undefined,
                        form: undefined
                      }));
                    }}
                  >
                    {calibrationStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {validationErrors.status ? (
                    <small className="instrument-modal__field-error">
                      {validationErrors.status}
                    </small>
                  ) : null}
                </label>

                <label className="instrument-modal__field">
                  <span>Responsavel</span>
                  <input
                    type="text"
                    className={validationErrors.responsible ? "is-invalid" : undefined}
                    value={formState.responsible}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        responsible: event.target.value
                      }));
                      setValidationErrors((current) => ({
                        ...current,
                        responsible: undefined,
                        form: undefined
                      }));
                    }}
                  />
                  {validationErrors.responsible ? (
                    <small className="instrument-modal__field-error">
                      {validationErrors.responsible}
                    </small>
                  ) : null}
                </label>

                <label className="instrument-modal__field">
                  <span>Data da calibracao</span>
                  <input
                    type="date"
                    className={validationErrors.calibrationDate ? "is-invalid" : undefined}
                    value={formState.calibrationDate}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        calibrationDate: event.target.value
                      }));
                      setValidationErrors((current) => ({
                        ...current,
                        calibrationDate: undefined,
                        validityDate: undefined,
                        form: undefined
                      }));
                    }}
                  />
                  {validationErrors.calibrationDate ? (
                    <small className="instrument-modal__field-error">
                      {validationErrors.calibrationDate}
                    </small>
                  ) : null}
                </label>

                <label className="instrument-modal__field">
                  <span>Emissao do certificado</span>
                  <input
                    type="date"
                    className={validationErrors.certificateDate ? "is-invalid" : undefined}
                    value={formState.certificateDate}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        certificateDate: event.target.value
                      }));
                      setValidationErrors((current) => ({
                        ...current,
                        certificateDate: undefined,
                        form: undefined
                      }));
                    }}
                  />
                  {validationErrors.certificateDate ? (
                    <small className="instrument-modal__field-error">
                      {validationErrors.certificateDate}
                    </small>
                  ) : null}
                </label>

                <label className="instrument-modal__field instrument-modal__field--full">
                  <span>Proxima calibracao</span>
                  <input
                    type="date"
                    className={validationErrors.validityDate ? "is-invalid" : undefined}
                    value={formState.validityDate}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        validityDate: event.target.value
                      }));
                      setValidationErrors((current) => ({
                        ...current,
                        validityDate: undefined,
                        form: undefined
                      }));
                    }}
                  />
                  {validationErrors.validityDate ? (
                    <small className="instrument-modal__field-error">
                      {validationErrors.validityDate}
                    </small>
                  ) : null}
                </label>
              </div>

              <section className="instrument-calibration-review">
                <div className="instrument-calibration-review__header">
                  <div>
                    <h3>Tabela de calibracao</h3>
                    <p>Digite os valores dos itens e use a IA como pre-preenchimento quando o certificado ajudar.</p>
                  </div>

                  <div className="instrument-calibration-review__summary">
                    <span>{fieldResults.length} itens</span>
                  </div>
                </div>

                {extractionWarnings.length > 0 ? (
                  <div className="instrument-calibration-review__warnings">
                    {extractionWarnings.map((warning, index) => (
                      <p key={`${warning}-${index}`}>{warning}</p>
                    ))}
                  </div>
                ) : null}

                <CalibrationFieldReviewTable
                  rows={fieldResults.map((field) => ({
                    id: field.fieldId,
                    fieldName: field.fieldName,
                    measurementName: field.measurementName,
                    groupName: field.groupName,
                    subgroupName: field.subgroupName,
                    autoCalculated: isAutoCalculatedCalibrationField(
                      getCalibrationCategoryIdentifier(instrument),
                      field.fieldSlug
                    ),
                    value: field.value,
                    unit: field.unit,
                    confidence: field.confidence,
                    evidence: field.evidence,
                    status: field.status
                  }))}
                  editable
                  showStatusColumn={false}
                  emptyMessage="Esse instrumento ainda nao possui itens configurados no template de calibracao."
                  onValueChange={(rowId, value) =>
                    setFieldResults((current) =>
                      applyCalibrationDerivedValues(
                        getCalibrationCategoryIdentifier(instrument),
                        current.map((item) =>
                          item.fieldId === rowId
                            ? {
                                ...item,
                                value
                              }
                            : item
                        )
                      )
                    )
                  }
                />

                <div className="instrument-calibration-review__confirm">
                  <label className="instrument-calibration-review__confirm-check">
                    <input
                      type="checkbox"
                      checked={isPageConformityChecked}
                      onChange={(event) => setIsPageConformityChecked(event.target.checked)}
                    />
                    <span>Confirmo a conformidade desta calibracao.</span>
                  </label>
                  <p>Use esse check somente depois de revisar a tabela inteira.</p>
                </div>
              </section>

              <label className="instrument-modal__field instrument-modal__field--full">
                <span>Observacoes</span>
                <textarea
                  className="instrument-calibration-form__textarea"
                  placeholder="Informacoes adicionais sobre a calibracao, ressalvas ou notas da analise."
                  value={formState.observations}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      observations: event.target.value
                    }));
                    setValidationErrors((current) => ({
                      ...current,
                      form: undefined
                    }));
                  }}
                  rows={5}
                />
              </label>

              {validationErrors.form ? (
                <p className="instrument-modal__field-error">{validationErrors.form}</p>
              ) : null}

              <footer className="instrument-calibration-form__footer">
                <PageTransitionLink
                  href={`/instrumentos/${instrumentId}`}
                  className="instrument-calibration-form__cancel"
                >
                  Cancelar
                </PageTransitionLink>

                <button
                  type="submit"
                  className="instrument-calibration-form__submit"
                  disabled={isSubmitting || isExtracting}
                >
                  {isSubmitting ? "Registrando..." : "Registrar calibracao"}
                </button>
              </footer>
            </form>
          </article>
        </section>
      ) : null}
    </section>
  );
}
