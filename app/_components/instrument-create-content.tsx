"use client";

import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api/client";
import {
  applyCalibrationDerivedValues,
  isAutoCalculatedCalibrationField
} from "@/lib/calibration-derivations";
import { calibrationStatusOptions, type CalibrationHistoryItem } from "@/lib/calibrations";
import type { InstrumentDetailItem } from "@/lib/instruments";
import {
  serializeMeasurementFieldSlug,
  type MeasurementFieldItem
} from "@/lib/measurement-fields";
import type { MeasurementItem } from "@/lib/measurements";
import { CalibrationFieldReviewTable } from "./calibration-field-review-table";
import { DefaultFieldPreviewTable } from "./default-field-preview-table";
import { PageTransitionLink } from "./page-transition-link";

type Step = "details" | "certificate";

type InstrumentFormState = {
  tag: string;
  category: string;
  newCategoryName: string;
  manufacturer: string;
};

type InstrumentFieldFormItem = {
  clientId: string;
  name: string;
  measurementId: string;
  groupName: string;
  subgroupName: string;
};

type InstrumentMetadataCategory = {
  id: number;
  name: string;
  slug: string;
  fields: MeasurementFieldItem[];
};

type InstrumentMetadataResponse = {
  error?: string;
  categories?: InstrumentMetadataCategory[];
  measurements?: MeasurementItem[];
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

type CreateCalibrationFormState = {
  responsible: string;
  status: (typeof calibrationStatusOptions)[number]["value"];
  calibrationDate: string;
  certificateDate: string;
  validityDate: string;
  observations: string;
  certificateFile: File | null;
};

type FieldReviewStatus = "unknown" | "conforming" | "non_conforming";

type FieldReviewItem = {
  fieldSlug: string;
  fieldName: string;
  measurementName: string;
  groupName: string;
  subgroupName: string;
  value: string;
  unit: string;
  confidence: number | null;
  evidence: string;
  status: FieldReviewStatus;
};

type ValidationErrors = Partial<
  Record<
    | "tag"
    | "category"
    | "newCategoryName"
    | "manufacturer"
    | "fields"
    | "responsible"
    | "calibrationDate"
    | "certificateDate"
    | "validityDate"
    | "certificateFile"
    | "form",
    string
  >
>;

const emptyFormState: InstrumentFormState = {
  tag: "",
  category: "",
  newCategoryName: "",
  manufacturer: ""
};

const maxCertificateFileSize = 10 * 1024 * 1024;

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyCalibrationFormState(): CreateCalibrationFormState {
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

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapCategoryFieldToFormItem(field: MeasurementFieldItem): InstrumentFieldFormItem {
  return {
    clientId: createClientId(),
    name: field.name,
    measurementId: field.measurementId,
    groupName: field.groupName ?? "",
    subgroupName: field.subgroupName ?? ""
  };
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function formatFileSize(fileSize: number) {
  return fileSize >= 1024 * 1024
    ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(fileSize / 1024)} KB`;
}

function buildReviewItems(
  fieldRows: InstrumentFieldFormItem[],
  measurements: MeasurementItem[],
  currentItems: FieldReviewItem[] = []
) {
  const measurementsById = new Map(measurements.map((measurement) => [measurement.id, measurement]));
  const currentBySlug = new Map(currentItems.map((item) => [item.fieldSlug, item]));

  return fieldRows.flatMap((field) => {
    const name = field.name.trim();
    const groupName = field.groupName.trim();
    const subgroupName = field.subgroupName.trim();
    const slug = serializeMeasurementFieldSlug({
      name,
      groupName,
      subgroupName
    });

    if (!name || !slug) {
      return [];
    }

    const measurement = measurementsById.get(field.measurementId);
    const currentItem = currentBySlug.get(slug);

    return [{
      fieldSlug: slug,
      fieldName: name,
      measurementName: measurement?.name ?? currentItem?.measurementName ?? "",
      groupName,
      subgroupName,
      value: currentItem?.value ?? "",
      unit: currentItem?.unit ?? "",
      confidence: currentItem?.confidence ?? null,
      evidence: currentItem?.evidence ?? "",
      status: currentItem?.status ?? "unknown"
    }];
  });
}

function getCategoryCalculationIdentifier(categorySlug: string | null | undefined, categoryName: string | null | undefined) {
  return categorySlug || categoryName || "";
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

export function InstrumentCreateContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [metadataCategories, setMetadataCategories] = useState<InstrumentMetadataCategory[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [formState, setFormState] = useState<InstrumentFormState>(emptyFormState);
  const [fieldRows, setFieldRows] = useState<InstrumentFieldFormItem[]>([]);
  const [calibrationForm, setCalibrationForm] =
    useState<CreateCalibrationFormState>(() => createEmptyCalibrationFormState());
  const [fieldReviewItems, setFieldReviewItems] = useState<FieldReviewItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [loadError, setLoadError] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPageConformityChecked, setIsPageConformityChecked] = useState(false);
  const [extractionError, setExtractionError] = useState("");
  const [extractionMessage, setExtractionMessage] = useState("");
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);

  const selectedCategory = useMemo(
    () => metadataCategories.find((category) => category.slug === formState.category),
    [formState.category, metadataCategories]
  );
  const selectedCategoryLabel = useMemo(
    () => selectedCategory?.name ?? "",
    [selectedCategory]
  );
  useEffect(() => {
    void loadMetadata();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setFieldRows([]);
      return;
    }

    setFieldRows(selectedCategory.fields.map(mapCategoryFieldToFormItem));
  }, [selectedCategory]);

  useEffect(() => {
    setFieldReviewItems((current) =>
      applyCalibrationDerivedValues(
        getCategoryCalculationIdentifier(selectedCategory?.slug, selectedCategory?.name),
        buildReviewItems(fieldRows, measurements, current)
      )
    );
  }, [fieldRows, measurements, selectedCategory]);

  async function loadMetadata() {
    setIsLoadingMetadata(true);

    try {
      const response = await fetchApi("/api/instrumentos/metadata", {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as InstrumentMetadataResponse;

      if (!response.ok) {
        setMetadataCategories([]);
        setMeasurements([]);
        setLoadError(payload.error ?? "Nao foi possivel carregar categorias e medidas.");
      } else {
        setMetadataCategories(payload.categories ?? []);
        setMeasurements(payload.measurements ?? []);
        setLoadError("");
      }
    } catch {
      setMetadataCategories([]);
      setMeasurements([]);
      setLoadError("Nao foi possivel carregar categorias e medidas.");
    } finally {
      setIsLoadingMetadata(false);
    }
  }

  function clearExtractionFeedback() {
    setExtractionError("");
    setExtractionMessage("");
    setExtractionWarnings([]);
  }

  function getStepOneErrors() {
    const nextErrors: ValidationErrors = {};
    if (!formState.tag.trim()) nextErrors.tag = "Tag obrigatoria.";
    if (!formState.category) {
      nextErrors.category = "Categoria obrigatoria.";
    }
    if (!selectedCategory) {
      nextErrors.category = "Categoria obrigatoria.";
      return nextErrors;
    }

    if (selectedCategory.fields.length === 0) {
      nextErrors.fields =
        "Essa categoria ainda nao possui um template de calibracao cadastrado. Cadastre os itens em Categorias antes de continuar.";
    }

    return nextErrors;
  }

  function getStepTwoErrors() {
    const nextErrors: ValidationErrors = {};
    if (!calibrationForm.responsible.trim()) nextErrors.responsible = "Responsavel obrigatorio.";
    if (!calibrationForm.calibrationDate) nextErrors.calibrationDate = "Data da calibracao obrigatoria.";
    if (!calibrationForm.certificateDate) nextErrors.certificateDate = "Data de emissao do certificado obrigatoria.";
    if (!calibrationForm.validityDate) nextErrors.validityDate = "Data da proxima calibracao obrigatoria.";
    if (calibrationForm.calibrationDate && calibrationForm.validityDate && calibrationForm.validityDate < calibrationForm.calibrationDate) {
      nextErrors.validityDate = "A data da proxima calibracao nao pode ser menor que a data da calibracao.";
    }
    if (!calibrationForm.certificateFile) {
      nextErrors.certificateFile = "Envie o certificado em PDF.";
    } else if (!isPdfFile(calibrationForm.certificateFile)) {
      nextErrors.certificateFile = "O certificado deve estar no formato PDF.";
    } else if (calibrationForm.certificateFile.size > maxCertificateFileSize) {
      nextErrors.certificateFile = "O certificado deve ter no maximo 10 MB.";
    }
    return nextErrors;
  }

  async function rollbackInstrument(instrumentId: number) {
    try {
      await fetchApi("/api/instrumentos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: instrumentId })
      });
    } catch {
      // rollback best-effort
    }
  }

  async function handleExtractWithAi() {
    if (!calibrationForm.certificateFile) return;

    setIsExtracting(true);
    clearExtractionFeedback();

    try {
      const measurementsById = new Map(measurements.map((measurement) => [measurement.id, measurement]));
      const payload = new FormData();
      payload.set("instrumentTag", formState.tag.trim());
      payload.set("category", selectedCategoryLabel);
      payload.set(
        "fieldsJson",
        JSON.stringify(
          fieldRows.map((field) => {
            const measurement = measurementsById.get(field.measurementId);

            return {
              name: field.name.trim(),
              groupName: field.groupName.trim(),
              subgroupName: field.subgroupName.trim(),
              measurementName: measurement?.name ?? "",
              measurementRawName: measurement?.rawName ?? measurement?.name ?? ""
            };
          })
        )
      );
      payload.set("certificateFile", calibrationForm.certificateFile);

      const response = await fetchApi("/api/calibracoes/extrair", {
        method: "POST",
        body: payload
      });
      const responsePayload = (await response.json()) as CalibrationExtractionApiResponse;

      if (!response.ok || !responsePayload.extraction) {
        setExtractionError(responsePayload.error ?? "Nao foi possivel ler o certificado com a IA.");
        return;
      }

      setCalibrationForm((current) => ({
        ...current,
        responsible: responsePayload.extraction?.header.responsible ?? current.responsible,
        calibrationDate: responsePayload.extraction?.header.calibrationDate ?? current.calibrationDate,
        certificateDate: responsePayload.extraction?.header.certificateDate ?? current.certificateDate,
        validityDate: responsePayload.extraction?.header.validityDate ?? current.validityDate,
        observations: responsePayload.extraction?.header.observations ?? current.observations
      }));
      setFieldReviewItems((current) =>
        applyCalibrationDerivedValues(
          getCategoryCalculationIdentifier(selectedCategory?.slug, selectedCategory?.name),
          current.map((field) => {
          const extractedField = responsePayload.extraction?.fields.find((item) => item.fieldSlug === field.fieldSlug);

          if (!extractedField) return field;

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
      setExtractionMessage("Leitura concluida. Revise os dados sugeridos pela IA antes de salvar o cadastro.");
      setValidationErrors((current) => ({
        ...current,
        responsible: undefined,
        calibrationDate: undefined,
        certificateDate: undefined,
        validityDate: undefined,
        certificateFile: undefined,
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

    if (step === "details") {
      const stepOneErrors = getStepOneErrors();
      const nextErrors =
        Object.keys(stepOneErrors).length > 0
          ? {
              ...stepOneErrors,
              form: "Revise os campos obrigatorios antes de continuar."
            }
          : stepOneErrors;
      setValidationErrors(nextErrors);

      if (Object.keys(stepOneErrors).length > 0) {
        scrollToFirstValidationIssue();
        return;
      }

      setStep("certificate");
      return;
    }

    const mergedErrors = {
      ...getStepOneErrors(),
      ...getStepTwoErrors()
    };
    const nextErrors =
      Object.keys(mergedErrors).length > 0
        ? {
            ...mergedErrors,
            form: "Revise os campos obrigatorios acima antes de salvar."
          }
        : mergedErrors;
    setValidationErrors(nextErrors);

    if (Object.keys(mergedErrors).length > 0) {
      scrollToFirstValidationIssue();
      return;
    }

    setIsSubmitting(true);

    let createdInstrumentId: number | null = null;

    try {
      const instrumentResponse = await fetchApi("/api/instrumentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag: formState.tag.trim(),
          category: formState.category,
          manufacturer: formState.manufacturer.trim(),
          calibrationDate: calibrationForm.validityDate
        })
      });
      const instrumentPayload = (await instrumentResponse.json()) as InstrumentApiResponse;

      if (!instrumentResponse.ok || !instrumentPayload.item) {
        setValidationErrors({ form: instrumentPayload.error ?? "Nao foi possivel salvar o instrumento." });
        return;
      }

      createdInstrumentId = Number(instrumentPayload.item.id);

      const detailResponse = await fetchApi(`/api/instrumentos?id=${createdInstrumentId}`, {
        method: "GET",
        cache: "no-store"
      });
      const detailPayload = (await detailResponse.json()) as InstrumentApiResponse;

      if (!detailResponse.ok || !detailPayload.item) {
        await rollbackInstrument(createdInstrumentId);
        setValidationErrors({ form: detailPayload.error ?? "Nao foi possivel preparar a calibracao inicial." });
        return;
      }

      const detail = detailPayload.item as InstrumentDetailItem;
      const fieldIdBySlug = new Map(
        detail.fields
          .filter((field): field is typeof field & { dbId: number } => typeof field.dbId === "number")
          .map((field) => [field.slug, field.dbId] as const)
      );

      const calibrationPayload = new FormData();
      calibrationPayload.set("instrumentId", String(createdInstrumentId));
      calibrationPayload.set("responsible", calibrationForm.responsible.trim());
      calibrationPayload.set("status", calibrationForm.status);
      calibrationPayload.set("calibrationDate", calibrationForm.calibrationDate);
      calibrationPayload.set("certificateDate", calibrationForm.certificateDate);
      calibrationPayload.set("validityDate", calibrationForm.validityDate);
      calibrationPayload.set("observations", calibrationForm.observations.trim());
      calibrationPayload.set(
        "resultsJson",
        JSON.stringify(
          fieldReviewItems
            .map((field) => {
              const fieldId = fieldIdBySlug.get(field.fieldSlug);
              return fieldId
                ? {
                    fieldId,
                    fieldSlug: field.fieldSlug,
                    fieldName: field.fieldName,
                    measurementName: field.measurementName,
                    value: field.value,
                    unit: field.unit,
                    confidence: field.confidence,
                    evidence: field.evidence,
                    status: isPageConformityChecked ? "conforming" : "unknown"
                  }
                : null;
            })
            .filter(Boolean)
        )
      );

      if (calibrationForm.certificateFile) {
        calibrationPayload.set("certificateFile", calibrationForm.certificateFile);
      }

      const calibrationResponse = await fetchApi("/api/calibracoes", {
        method: "POST",
        body: calibrationPayload
      });
      const calibrationPayloadResponse = (await calibrationResponse.json()) as CalibrationCreateApiResponse;

      if (!calibrationResponse.ok || !calibrationPayloadResponse.item) {
        await rollbackInstrument(createdInstrumentId);
        setValidationErrors({ form: calibrationPayloadResponse.error ?? "Nao foi possivel concluir o cadastro com a calibracao inicial." });
        return;
      }

      router.push(`/instrumentos/${createdInstrumentId}`);
    } catch {
      if (createdInstrumentId) {
        await rollbackInstrument(createdInstrumentId);
      }
      setValidationErrors({ form: "Nao foi possivel concluir o cadastro do instrumento." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="inventory-content instrument-create-content">
      <div className="instrument-detail-nav instrument-detail-nav--split">
        <PageTransitionLink href="/instrumentos" className="instrument-detail-back">
          <span aria-hidden="true" className="instrument-detail-back__icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M14.5 6.5 9 12l5.5 5.5M10 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Voltar para instrumentos
        </PageTransitionLink>
      </div>

      <section className="inventory-table-card instrument-create-steps" aria-label="Etapas do cadastro">
        <div className={`instrument-create-step${step === "details" ? " is-active" : " is-complete"}`}>
          <span className="instrument-create-step__number">1</span>
          <div className="instrument-create-step__copy">
            <strong>Dados do instrumento</strong>
            <span>Categoria, fabricante e template</span>
          </div>
        </div>
        <div className={`instrument-create-step${step === "certificate" ? " is-active" : ""}`}>
          <span className="instrument-create-step__number">2</span>
          <div className="instrument-create-step__copy">
            <strong>Certificado e revisao</strong>
            <span>Upload, IA e confirmacao final</span>
          </div>
        </div>
      </section>

      {loadError ? (
        <section className="inventory-table-card instrument-detail-card instrument-detail-card--state">
          <p className="inventory-table__empty">{loadError}</p>
        </section>
      ) : null}

      <section className="inventory-table-card instrument-create-card">
        <header className="instrument-detail-card__header instrument-create-card__header">
          <div>
            <h2>{step === "details" ? "Novo instrumento" : "Certificado e calibracao inicial"}</h2>
            <p>
              {step === "details"
                ? "Cadastre os dados principais e confirme o template de calibracao herdado da categoria."
                : "Envie o PDF, extraia os dados com IA e revise tudo antes de salvar."}
            </p>
          </div>
        </header>

        <form className="instrument-create-form" onSubmit={handleSubmit}>
          {step === "details" ? (
            <>
              <div className="instrument-modal__grid">
                <label className="instrument-modal__field">
                  <span>Tag</span>
                  <input type="text" placeholder="Ex: DI-004" className={validationErrors.tag ? "is-invalid" : undefined} value={formState.tag} onChange={(event) => { setFormState((current) => ({ ...current, tag: event.target.value })); setValidationErrors((current) => ({ ...current, tag: undefined, form: undefined })); }} />
                  {validationErrors.tag ? <small className="instrument-modal__field-error">{validationErrors.tag}</small> : null}
                </label>

                <label className="instrument-modal__field">
                  <span>Fabricante (opcional)</span>
                  <input type="text" placeholder="Ex: Mitutoyo" className={validationErrors.manufacturer ? "is-invalid" : undefined} value={formState.manufacturer} onChange={(event) => { setFormState((current) => ({ ...current, manufacturer: event.target.value })); setValidationErrors((current) => ({ ...current, manufacturer: undefined, form: undefined })); }} />
                  {validationErrors.manufacturer ? <small className="instrument-modal__field-error">{validationErrors.manufacturer}</small> : <small className="instrument-modal__field-help">Se nao informar, o instrumento sera salvo como nao informado.</small>}
                </label>

                <div className="instrument-modal__field instrument-modal__field--category-builder">
                  <div className="instrument-modal__field-head">
                    <span>Categoria</span>
                    <PageTransitionLink href="/categorias" className="instrument-modal__link-button">
                      Gerenciar categorias
                    </PageTransitionLink>
                  </div>

                  <>
                    <select className={validationErrors.category ? "is-invalid" : undefined} value={formState.category} onChange={(event) => { setFormState((current) => ({ ...current, category: event.target.value })); setValidationErrors((current) => ({ ...current, category: undefined, fields: undefined, form: undefined })); }} disabled={isLoadingMetadata}>
                      <option value="" disabled>{isLoadingMetadata ? "Carregando categorias..." : "Selecione uma categoria"}</option>
                      {metadataCategories.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}
                    </select>
                    {validationErrors.category ? <small className="instrument-modal__field-error">{validationErrors.category}</small> : <small className="instrument-modal__field-help">A categoria define automaticamente o template de calibracao usado neste cadastro.</small>}
                  </>
                </div>
              </div>

                <section className="instrument-fields-builder">
                  <div className="instrument-fields-builder__header">
                    <div>
                      <h3>Template de calibracao da categoria</h3>
                      <p>Revise abaixo os itens que essa categoria vai aplicar ao instrumento.</p>
                    </div>
                  </div>

                  <DefaultFieldPreviewTable
                    fields={fieldRows.map((field) => ({
                      key: field.clientId,
                      name: field.name,
                      measurementId: field.measurementId,
                      groupName: field.groupName,
                      subgroupName: field.subgroupName
                    }))}
                    measurements={measurements}
                    emptyMessage={
                      selectedCategory
                        ? "Essa categoria ainda nao possui um template de calibracao cadastrado."
                        : "Selecione uma categoria para visualizar o template de calibracao."
                    }
                  />

                  {validationErrors.fields ? <p className="instrument-modal__field-error instrument-fields-builder__error">{validationErrors.fields}</p> : null}
              </section>
            </>
          ) : (
            <>
              <section className="instrument-create-summary">
                <div className="instrument-create-summary__item"><span>Tag</span><strong>{formState.tag}</strong></div>
                <div className="instrument-create-summary__item"><span>Categoria</span><strong>{selectedCategoryLabel || "Nao informada"}</strong></div>
                <div className="instrument-create-summary__item"><span>Fabricante</span><strong>{formState.manufacturer.trim() || "Nao informado"}</strong></div>
                <div className="instrument-create-summary__item"><span>Itens do template</span><strong>{fieldReviewItems.length}</strong></div>
              </section>

              <div className="instrument-modal__grid">
                <label className="instrument-modal__field"><span>Responsavel</span><input type="text" className={validationErrors.responsible ? "is-invalid" : undefined} value={calibrationForm.responsible} onChange={(event) => { setCalibrationForm((current) => ({ ...current, responsible: event.target.value })); setValidationErrors((current) => ({ ...current, responsible: undefined, form: undefined })); }} />{validationErrors.responsible ? <small className="instrument-modal__field-error">{validationErrors.responsible}</small> : null}</label>
                <label className="instrument-modal__field"><span>Status geral</span><select value={calibrationForm.status} onChange={(event) => setCalibrationForm((current) => ({ ...current, status: event.target.value as CreateCalibrationFormState["status"] }))}>{calibrationStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label className="instrument-modal__field"><span>Data da calibracao</span><input type="date" className={validationErrors.calibrationDate ? "is-invalid" : undefined} value={calibrationForm.calibrationDate} onChange={(event) => { setCalibrationForm((current) => ({ ...current, calibrationDate: event.target.value })); setValidationErrors((current) => ({ ...current, calibrationDate: undefined, form: undefined })); }} />{validationErrors.calibrationDate ? <small className="instrument-modal__field-error">{validationErrors.calibrationDate}</small> : null}</label>
                <label className="instrument-modal__field"><span>Emissao do certificado</span><input type="date" className={validationErrors.certificateDate ? "is-invalid" : undefined} value={calibrationForm.certificateDate} onChange={(event) => { setCalibrationForm((current) => ({ ...current, certificateDate: event.target.value })); setValidationErrors((current) => ({ ...current, certificateDate: undefined, form: undefined })); }} />{validationErrors.certificateDate ? <small className="instrument-modal__field-error">{validationErrors.certificateDate}</small> : null}</label>
                <label className="instrument-modal__field instrument-modal__field--full"><span>Proxima calibracao</span><input type="date" className={validationErrors.validityDate ? "is-invalid" : undefined} value={calibrationForm.validityDate} onChange={(event) => { setCalibrationForm((current) => ({ ...current, validityDate: event.target.value })); setValidationErrors((current) => ({ ...current, validityDate: undefined, form: undefined })); }} />{validationErrors.validityDate ? <small className="instrument-modal__field-error">{validationErrors.validityDate}</small> : null}</label>
              </div>

              <section className={`instrument-calibration-upload${validationErrors.certificateFile ? " is-invalid" : ""}`}>
                <div className="instrument-calibration-upload__copy"><strong>Certificado em PDF</strong><p>Envie o arquivo oficial para criar o instrumento ja com a calibracao inicial registrada. O nome do PDF sera usado no log.</p></div>
                <input type="file" accept="application/pdf,.pdf" onChange={(event: ChangeEvent<HTMLInputElement>) => { const nextFile = event.target.files?.[0] ?? null; setCalibrationForm((current) => ({ ...current, certificateFile: nextFile })); clearExtractionFeedback(); setValidationErrors((current) => ({ ...current, certificateFile: undefined, form: undefined })); }} />
                {calibrationForm.certificateFile ? <div className="instrument-calibration-upload__file"><span>{`${calibrationForm.certificateFile.name} (${formatFileSize(calibrationForm.certificateFile.size)})`}</span><button type="button" onClick={() => setCalibrationForm((current) => ({ ...current, certificateFile: null }))}>Remover arquivo</button></div> : null}
                <div className="instrument-calibration-upload__actions"><button type="button" className="instrument-calibration-upload__extract" onClick={handleExtractWithAi} disabled={!calibrationForm.certificateFile || isExtracting || isSubmitting}>{isExtracting ? "Lendo certificado..." : "Extrair com IA"}</button></div>
                {validationErrors.certificateFile ? <p className="instrument-modal__field-error">{validationErrors.certificateFile}</p> : <p className="instrument-calibration-upload__hint">Arquivo unico em PDF com ate 10 MB.</p>}
                {extractionError ? <p className="instrument-modal__field-error">{extractionError}</p> : null}
                {extractionMessage ? <p className="instrument-calibration-upload__success">{extractionMessage}</p> : null}
              </section>

              <section className="instrument-calibration-review">
                <div className="instrument-calibration-review__header">
                  <div><h3>Tabela de calibracao</h3><p>Digite os valores dos itens e use a IA como pre-preenchimento quando o certificado ajudar.</p></div>
                  <div className="instrument-calibration-review__summary"><span>{fieldReviewItems.length} itens</span></div>
                </div>
                {extractionWarnings.length > 0 ? <div className="instrument-calibration-review__warnings">{extractionWarnings.map((warning, index) => <p key={`${warning}-${index}`}>{warning}</p>)}</div> : null}
                <CalibrationFieldReviewTable
                  rows={fieldReviewItems.map((field) => ({
                    id: field.fieldSlug,
                    fieldName: field.fieldName,
                    measurementName: field.measurementName,
                    groupName: field.groupName,
                    subgroupName: field.subgroupName,
                    autoCalculated: isAutoCalculatedCalibrationField(
                      getCategoryCalculationIdentifier(selectedCategory?.slug, selectedCategory?.name),
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
                  emptyMessage="Esse cadastro ainda nao possui itens configurados no template de calibracao."
                  onValueChange={(rowId, value) =>
                    setFieldReviewItems((current) =>
                      applyCalibrationDerivedValues(
                        getCategoryCalculationIdentifier(selectedCategory?.slug, selectedCategory?.name),
                        current.map((item) =>
                          item.fieldSlug === rowId
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

              <label className="instrument-modal__field instrument-modal__field--full"><span>Observacoes</span><textarea className="instrument-calibration-form__textarea" value={calibrationForm.observations} onChange={(event) => setCalibrationForm((current) => ({ ...current, observations: event.target.value }))} rows={5} /></label>
            </>
          )}

          {validationErrors.form ? <p className="instrument-modal__field-error">{validationErrors.form}</p> : null}

          <footer className="instrument-calibration-form__footer">
            <PageTransitionLink href="/instrumentos" className="instrument-calibration-form__cancel">Cancelar</PageTransitionLink>
            {step === "certificate" ? <button type="button" className="instrument-calibration-form__cancel" onClick={() => setStep("details")} disabled={isSubmitting || isExtracting}>Voltar para dados</button> : null}
            <button type="submit" className="instrument-calibration-form__submit" disabled={isSubmitting || isExtracting || isLoadingMetadata}>{isSubmitting ? "Salvando..." : step === "details" ? "Continuar para certificado" : "Salvar instrumento e calibracao"}</button>
          </footer>
        </form>
      </section>
    </section>
  );
}
