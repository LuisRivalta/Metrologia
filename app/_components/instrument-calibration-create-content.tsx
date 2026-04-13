"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api/client";
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
      certificate: string | null;
      laboratory: string | null;
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
  certificate: string;
  laboratory: string;
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
  value: string;
  unit: string;
  confidence: number | null;
  evidence: string;
  status: CalibrationFieldReviewStatus;
};

type CalibrationCreateValidationErrors = Partial<
  Record<
    | "certificate"
    | "laboratory"
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
    certificate: "",
    laboratory: "",
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

function getCalibrationStatusLabel(tone: InstrumentDetailItem["tone"]) {
  if (tone === "danger") return "Vencido";
  if (tone === "warning") return "Perto de vencer";
  return "No prazo";
}

function getCalibrationAlertCopy(item: InstrumentDetailItem) {
  if (item.tone === "danger") {
    return "Esse instrumento ja esta vencido. Registre a nova calibracao para atualizar o prazo e manter o historico auditavel.";
  }

  if (item.tone === "warning") {
    return "Esse instrumento esta perto de vencer. Registrar a nova calibracao agora evita perda de prazo e mantem o certificado vinculado ao historico.";
  }

  return "Use esta tela para substituir o ciclo atual por um novo certificado e manter a rastreabilidade do instrumento.";
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
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
        setFieldResults(createFieldReviewItems(payload.item));
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

  const reviewedSummary = useMemo(() => {
    return {
      conforming: fieldResults.filter((field) => field.status === "conforming").length,
      pending: fieldResults.filter((field) => field.status !== "conforming").length
    };
  }, [fieldResults]);

  function validateForm() {
    const nextErrors: CalibrationCreateValidationErrors = {};

    if (!formState.certificate.trim()) {
      nextErrors.certificate = "Numero do certificado obrigatorio.";
    }

    if (!formState.laboratory.trim()) {
      nextErrors.laboratory = "Laboratorio obrigatorio.";
    }

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
    return Object.keys(nextErrors).length === 0;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    setFormState((current) => ({
      ...current,
      certificateFile: nextFile
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
  }

  async function handleExtractWithAi() {
    if (!formState.certificateFile || !instrument) {
      return;
    }

    setIsExtracting(true);
    setExtractionError("");
    setExtractionMessage("");
    setExtractionWarnings([]);

    try {
      const payload = new FormData();
      payload.set("instrumentId", String(instrumentId));
      payload.set("certificateFile", formState.certificateFile);

      const response = await fetchApi("/api/calibracoes/extrair", {
        method: "POST",
        body: payload
      });
      const responsePayload = (await response.json()) as CalibrationExtractionApiResponse;

      if (!response.ok || !responsePayload.extraction) {
        setExtractionError(responsePayload.error ?? "Nao foi possivel ler o certificado com a IA.");
        setIsExtracting(false);
        return;
      }

      setFormState((current) => ({
        ...current,
        certificate: responsePayload.extraction?.header.certificate ?? current.certificate,
        laboratory: responsePayload.extraction?.header.laboratory ?? current.laboratory,
        responsible: responsePayload.extraction?.header.responsible ?? current.responsible,
        calibrationDate:
          responsePayload.extraction?.header.calibrationDate ?? current.calibrationDate,
        certificateDate:
          responsePayload.extraction?.header.certificateDate ?? current.certificateDate,
        validityDate: responsePayload.extraction?.header.validityDate ?? current.validityDate,
        observations: responsePayload.extraction?.header.observations ?? current.observations
      }));
      setFieldResults((current) =>
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
      );
      setExtractionWarnings(responsePayload.extraction.warnings);
      setExtractionMessage(
        "Leitura concluida. Revise os dados sugeridos pela IA antes de registrar a calibracao."
      );
      setValidationErrors((current) => ({
        ...current,
        certificate: undefined,
        laboratory: undefined,
        responsible: undefined,
        calibrationDate: undefined,
        certificateDate: undefined,
        validityDate: undefined,
        form: undefined
      }));
    } catch {
      setExtractionError("Nao foi possivel ler o certificado com a IA.");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.set("instrumentId", String(instrumentId));
      payload.set("certificate", formState.certificate.trim());
      payload.set("laboratory", formState.laboratory.trim());
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
            status: field.status
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
          <article className="inventory-table-card instrument-calibration-create-card instrument-calibration-create-card--aside">
            <div className="instrument-calibration-create-card__copy">
              <p className="instrument-detail-hero__eyebrow">Novo registro de calibracao</p>
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
              <div className="instrument-calibration-create-summary__item">
                <span>Status atual</span>
                <strong>{getCalibrationStatusLabel(instrument.tone)}</strong>
              </div>
              <div className="instrument-calibration-create-summary__item">
                <span>Prazo atual</span>
                <strong>{instrument.calibration}</strong>
              </div>
              <div className="instrument-calibration-create-summary__item">
                <span>Itens do template</span>
                <strong>{instrument.fields.length}</strong>
              </div>
            </div>

            <section
              className={`instrument-detail-alert instrument-detail-alert--${instrument.tone} instrument-detail-alert--inline`}
            >
              <div>
                <strong>
                  {instrument.tone === "danger"
                    ? "Instrumento vencido"
                    : instrument.tone === "warning"
                      ? "Prazo proximo"
                      : "Pronto para novo ciclo"}
                </strong>
                <p>{getCalibrationAlertCopy(instrument)}</p>
              </div>
            </section>
          </article>

          <article className="inventory-table-card instrument-calibration-create-card instrument-calibration-create-card--form">
            <header className="instrument-detail-card__header instrument-calibration-create-card__header">
              <div>
                <h3>Registrar calibracao</h3>
                <p>Envie o certificado em PDF e atualize o prazo do instrumento.</p>
              </div>
            </header>

            <form className="instrument-calibration-form" onSubmit={handleSubmit}>
              <div className="instrument-calibration-form__grid">
                <label className="instrument-modal__field">
                  <span>Numero do certificado</span>
                  <input
                    type="text"
                    placeholder="Ex: CAL-2026-048"
                    className={validationErrors.certificate ? "is-invalid" : undefined}
                    value={formState.certificate}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        certificate: event.target.value
                      }));
                      setValidationErrors((current) => ({
                        ...current,
                        certificate: undefined,
                        form: undefined
                      }));
                    }}
                  />
                  {validationErrors.certificate ? (
                    <small className="instrument-modal__field-error">
                      {validationErrors.certificate}
                    </small>
                  ) : null}
                </label>

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
                  <span>Laboratorio</span>
                  <input
                    type="text"
                    placeholder="Ex: RBC Metrologia"
                    className={validationErrors.laboratory ? "is-invalid" : undefined}
                    value={formState.laboratory}
                    onChange={(event) => {
                      setFormState((current) => ({
                        ...current,
                        laboratory: event.target.value
                      }));
                      setValidationErrors((current) => ({
                        ...current,
                        laboratory: undefined,
                        form: undefined
                      }));
                    }}
                  />
                  {validationErrors.laboratory ? (
                    <small className="instrument-modal__field-error">
                      {validationErrors.laboratory}
                    </small>
                  ) : null}
                </label>

                <label className="instrument-modal__field">
                  <span>Responsavel</span>
                  <input
                    type="text"
                    placeholder="Ex: Luis Fernandes"
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
                  ) : (
                    <small className="instrument-modal__field-help">
                      Essa data atualiza o prazo visivel na ficha do instrumento e no dashboard.
                    </small>
                  )}
                </label>
              </div>

              <section
                className={`instrument-calibration-upload${
                  validationErrors.certificateFile ? " is-invalid" : ""
                }`}
              >
                <div className="instrument-calibration-upload__copy">
                  <strong>Certificado em PDF</strong>
                  <p>Envie o arquivo oficial para manter o historico de auditoria vinculado ao instrumento.</p>
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

              <section className="instrument-calibration-review">
                <div className="instrument-calibration-review__header">
                  <div>
                    <h3>Tabela de calibracao</h3>
                    <p>Digite os valores dos itens e use a IA como pre-preenchimento quando o certificado ajudar.</p>
                  </div>

                  <div className="instrument-calibration-review__summary">
                    <span>{reviewedSummary.conforming} conformes</span>
                    <span>{reviewedSummary.pending} sem check</span>
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
                    value: field.value,
                    unit: field.unit,
                    confidence: field.confidence,
                    evidence: field.evidence,
                    status: field.status
                  }))}
                  editable
                  emptyMessage="Esse instrumento ainda nao possui itens configurados no template de calibracao."
                  onValueChange={(rowId, value) =>
                    setFieldResults((current) =>
                      current.map((item) =>
                        item.fieldId === rowId
                          ? {
                              ...item,
                              value
                            }
                          : item
                      )
                    )
                  }
                  onStatusChange={(rowId, status) =>
                    setFieldResults((current) =>
                      current.map((item) =>
                        item.fieldId === rowId
                          ? {
                              ...item,
                              status
                            }
                          : item
                      )
                    )
                  }
                />
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
