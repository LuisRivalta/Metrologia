"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { InstrumentDetailItem, InstrumentItem } from "@/lib/instruments";
import type {
  MeasurementFieldItem,
  MeasurementFieldSource
} from "@/lib/measurement-fields";
import type { MeasurementItem } from "@/lib/measurements";

type InstrumentFormState = {
  tag: string;
  category: string;
  newCategoryName: string;
  manufacturer: string;
  calibrationDate: string;
};

type InstrumentFieldFormItem = {
  clientId: string;
  name: string;
  measurementId: string;
  source: MeasurementFieldSource;
  categoryFieldId: string;
};

type InstrumentValidationErrors = Partial<
  Record<
    | "tag"
    | "category"
    | "newCategoryName"
    | "manufacturer"
    | "calibrationDate"
    | "fields"
    | "form",
    string
  >
>;
type CalibrationFilter = "all" | "neutral" | "warning" | "danger";
type SortKey = "tag" | "category" | "manufacturer" | "calibration";
type SortDirection = "asc" | "desc";

type InstrumentApiResponse = {
  error?: string;
  item?: InstrumentItem | InstrumentDetailItem;
  items?: InstrumentItem[];
  success?: boolean;
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

const LEGACY_INSTRUMENTS_STORAGE_KEY = "metrologia:instrumentos";
const emptyFormState: InstrumentFormState = {
  tag: "",
  category: "",
  newCategoryName: "",
  manufacturer: "",
  calibrationDate: ""
};

function normalizeSearchValue(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function getCalibrationDisplayParts(value: string) {
  const match = value.match(/^(.*?)(?: \((.*)\))?$/);
  return { dateLabel: match?.[1] ?? value, statusLabel: match?.[2] ?? "" };
}

function getCalibrationTimestamp(row: InstrumentItem) {
  return row.calibrationDateValue ? new Date(`${row.calibrationDateValue}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
}

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapFieldToFormItem(field: MeasurementFieldItem): InstrumentFieldFormItem {
  return {
    clientId: createClientId(),
    name: field.name,
    measurementId: field.measurementId,
    source: field.source,
    categoryFieldId: field.categoryFieldId ? String(field.categoryFieldId) : ""
  };
}

function createEmptyField(source: MeasurementFieldSource): InstrumentFieldFormItem {
  return {
    clientId: createClientId(),
    name: "",
    measurementId: "",
    source,
    categoryFieldId: ""
  };
}

export function InstrumentsContent() {
  const [rows, setRows] = useState<InstrumentItem[]>([]);
  const [metadataCategories, setMetadataCategories] = useState<InstrumentMetadataCategory[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [calibrationFilter, setCalibrationFilter] = useState<CalibrationFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingInstrumentId, setEditingInstrumentId] = useState<number | null>(null);
  const [formState, setFormState] = useState<InstrumentFormState>(emptyFormState);
  const [fieldRows, setFieldRows] = useState<InstrumentFieldFormItem[]>([]);
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [validationErrors, setValidationErrors] = useState<InstrumentValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInstrumentDetail, setIsLoadingInstrumentDetail] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryOptions = useMemo(() => metadataCategories, [metadataCategories]);
  const manufacturerOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.manufacturer))).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })),
    [rows]
  );
  const selectedCategory = useMemo(
    () => categoryOptions.find((category) => category.slug === formState.category),
    [categoryOptions, formState.category]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    return rows.filter((row) => {
      const matchesSearch =
        !normalizedSearchTerm ||
        normalizeSearchValue(row.tag).includes(normalizedSearchTerm) ||
        normalizeSearchValue(row.category).includes(normalizedSearchTerm) ||
        normalizeSearchValue(row.manufacturer).includes(normalizedSearchTerm) ||
        normalizeSearchValue(row.calibration).includes(normalizedSearchTerm);
      const matchesCategory = !categoryFilter || row.category === categoryFilter;
      const matchesManufacturer = !manufacturerFilter || row.manufacturer === manufacturerFilter;
      const matchesCalibration = calibrationFilter === "all" || row.tone === calibrationFilter;
      return matchesSearch && matchesCategory && matchesManufacturer && matchesCalibration;
    });
  }, [rows, searchTerm, categoryFilter, manufacturerFilter, calibrationFilter]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const directionFactor = sortDirection === "asc" ? 1 : -1;
    return [...filteredRows].sort((first, second) => {
      if (sortKey === "calibration") return (getCalibrationTimestamp(first) - getCalibrationTimestamp(second)) * directionFactor;
      return normalizeSearchValue(first[sortKey]).localeCompare(normalizeSearchValue(second[sortKey]), "pt-BR", { sensitivity: "base" }) * directionFactor;
    });
  }, [filteredRows, sortDirection, sortKey]);

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_INSTRUMENTS_STORAGE_KEY);
    void Promise.all([loadInstruments(), loadInstrumentMetadata()]);
  }, []);

  async function loadInstruments() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/instrumentos", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as InstrumentApiResponse;
      if (!response.ok) {
        setRows([]);
        setLoadError(payload.error ?? "Nao foi possivel carregar os instrumentos.");
      } else {
        setRows(payload.items ?? []);
        setLoadError("");
      }
    } catch {
      setRows([]);
      setLoadError("Nao foi possivel carregar os instrumentos.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadInstrumentMetadata() {
    setIsLoadingMetadata(true);
    try {
      const response = await fetch("/api/instrumentos/metadata", {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as InstrumentMetadataResponse;
      if (!response.ok) {
        setMetadataCategories([]);
        setMeasurements([]);
        setLoadError((current) => current || payload.error || "Nao foi possivel carregar categorias e medidas.");
      } else {
        setMetadataCategories(payload.categories ?? []);
        setMeasurements(payload.measurements ?? []);
      }
    } catch {
      setMetadataCategories([]);
      setMeasurements([]);
      setLoadError((current) => current || "Nao foi possivel carregar categorias e medidas.");
    } finally {
      setIsLoadingMetadata(false);
    }
  }

  async function loadInstrumentDetail(instrumentId: number) {
    setIsLoadingInstrumentDetail(true);
    try {
      const response = await fetch(`/api/instrumentos?id=${instrumentId}`, {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as InstrumentApiResponse;

      if (!response.ok || !payload.item) {
        setValidationErrors((current) => ({
          ...current,
          form: payload.error ?? "Nao foi possivel carregar os detalhes do instrumento."
        }));
        setFieldRows([]);
        return;
      }

      const detail = payload.item as InstrumentDetailItem;

      setFormState({
        tag: detail.tag,
        category: detail.categorySlug ?? "",
        newCategoryName: "",
        manufacturer: detail.manufacturer,
        calibrationDate: detail.calibrationDateValue ?? ""
      });
      setFieldRows((detail.fields ?? []).map(mapFieldToFormItem));
      setUseNewCategory(false);
      setValidationErrors({});
    } catch {
      setValidationErrors((current) => ({
        ...current,
        form: "Nao foi possivel carregar os detalhes do instrumento."
      }));
      setFieldRows([]);
    } finally {
      setIsLoadingInstrumentDetail(false);
    }
  }

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function resetModalState() {
    setModalMode("create");
    setEditingInstrumentId(null);
    setUseNewCategory(false);
    setValidationErrors({});
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(false);
    setIsLoadingInstrumentDetail(false);
    setFormState({ ...emptyFormState });
    setFieldRows([]);
  }

  function openCreateModal() {
    resetModalState();
    setIsModalOpen(true);
  }

  function openEditModal(row: InstrumentItem) {
    resetModalState();
    setModalMode("edit");
    setEditingInstrumentId(row.id);
    setFormState({
      tag: row.tag,
      category: row.categorySlug ?? "",
      newCategoryName: "",
      manufacturer: row.manufacturer,
      calibrationDate: row.calibrationDateValue ?? ""
    });
    setIsModalOpen(true);
    void loadInstrumentDetail(row.id);
  }

  function closeModal() {
    if (isSubmitting || isDeleting) return;

    setIsModalOpen(false);
    resetModalState();
  }

  function applyCategoryDefaults(categorySlug: string) {
    const category = categoryOptions.find((item) => item.slug === categorySlug);
    const defaults = category?.fields ?? [];
    setFieldRows(defaults.map(mapFieldToFormItem));
  }

  function enableNewCategoryMode() {
    setUseNewCategory(true);
    setFormState((current) => ({
      ...current,
      category: "",
      newCategoryName: ""
    }));
    setFieldRows([createEmptyField("category")]);
    setValidationErrors((current) => ({
      ...current,
      category: undefined,
      newCategoryName: undefined,
      fields: undefined,
      form: undefined
    }));
  }

  function disableNewCategoryMode() {
    setUseNewCategory(false);
    setFormState((current) => ({
      ...current,
      category: "",
      newCategoryName: ""
    }));
    setFieldRows([]);
    setValidationErrors((current) => ({
      ...current,
      category: undefined,
      newCategoryName: undefined,
      fields: undefined,
      form: undefined
    }));
  }

  function handleSelectCategory(categorySlug: string) {
    setUseNewCategory(false);
    setFormState((current) => ({
      ...current,
      category: categorySlug,
      newCategoryName: ""
    }));
    applyCategoryDefaults(categorySlug);
    setValidationErrors((current) => ({
      ...current,
      category: undefined,
      newCategoryName: undefined,
      fields: undefined,
      form: undefined
    }));
  }

  function handleAddField() {
    const source: MeasurementFieldSource = useNewCategory ? "category" : "instrument";
    setFieldRows((current) => [...current, createEmptyField(source)]);
    setValidationErrors((current) => ({
      ...current,
      fields: undefined,
      form: undefined
    }));
  }

  function updateFieldRow(
    clientId: string,
    key: keyof Pick<InstrumentFieldFormItem, "name" | "measurementId">,
    value: string
  ) {
    setFieldRows((current) =>
      current.map((row) =>
        row.clientId === clientId
          ? {
              ...row,
              [key]: value
            }
          : row
      )
    );
    setValidationErrors((current) => ({
      ...current,
      fields: undefined,
      form: undefined
    }));
  }

  function removeFieldRow(clientId: string) {
    setFieldRows((current) => current.filter((row) => row.clientId !== clientId));
    setValidationErrors((current) => ({
      ...current,
      fields: undefined,
      form: undefined
    }));
  }

  function validateForm() {
    const nextErrors: InstrumentValidationErrors = {};
    if (!formState.tag.trim()) nextErrors.tag = "Tag obrigatoria.";
    if (useNewCategory) {
      if (!formState.newCategoryName.trim()) nextErrors.newCategoryName = "Nome da nova categoria obrigatorio.";
    } else if (!formState.category) {
      nextErrors.category = "Categoria obrigatoria.";
    }
    if (!formState.manufacturer.trim()) nextErrors.manufacturer = "Fabricante obrigatorio.";
    if (!formState.calibrationDate) nextErrors.calibrationDate = "Prazo de calibracao obrigatorio.";
    if (fieldRows.length === 0) {
      nextErrors.fields = useNewCategory
        ? "Adicione pelo menos um campo padrao para a nova categoria."
        : "Adicione pelo menos um campo de medicao.";
    }
    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/instrumentos", {
        method: modalMode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingInstrumentId,
          tag: formState.tag.trim(),
          category: formState.category,
          useNewCategory,
          newCategoryName: formState.newCategoryName.trim(),
          manufacturer: formState.manufacturer.trim(),
          calibrationDate: formState.calibrationDate,
          fields: fieldRows.map((field) => ({
            name: field.name,
            measurementId: field.measurementId,
            source: field.source,
            categoryFieldId: field.categoryFieldId || null
          }))
        })
      });
      const payload = (await response.json()) as InstrumentApiResponse;
      if (!response.ok || !payload.item) {
        setValidationErrors({ form: payload.error ?? "Nao foi possivel salvar o instrumento." });
        return;
      }
      await Promise.all([loadInstruments(), loadInstrumentMetadata()]);
      setLoadError("");
      closeModal();
    } catch {
      setValidationErrors({ form: "Nao foi possivel salvar o instrumento." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteInstrument() {
    if (editingInstrumentId === null || deleteConfirmationText.trim() !== "CONFIRMAR") return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/instrumentos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingInstrumentId })
      });
      const payload = (await response.json()) as InstrumentApiResponse;
      if (!response.ok) {
        setLoadError(payload.error ?? "Nao foi possivel excluir o instrumento.");
        return;
      }
      await loadInstruments();
      setLoadError("");
      closeModal();
    } catch {
      setLoadError("Nao foi possivel excluir o instrumento.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <section className="inventory-content">
        <div className="inventory-actions">
          <label className="inventory-search">
            <span className="inventory-search__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input type="search" placeholder="Pesquisar por Tag, Categoria ou Fabricante" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </label>
          <button type="button" className={`toolbar-button${isFiltersOpen ? " is-active" : ""}`} onClick={() => setIsFiltersOpen((current) => !current)}>
            <svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M8 12h8M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            Filtros
          </button>
          <button type="button" className="primary-toolbar-button" onClick={openCreateModal}>
            <span className="primary-toolbar-button__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></span>
            Adicionar Novo Instrumento
          </button>
        </div>

        {isFiltersOpen ? (
          <section className="inventory-filters-card" aria-label="Filtros da tabela">
            <div className="inventory-filters-grid">
              <label className="inventory-filter-field"><span>Categoria</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">Todas as categorias</option>{categoryOptions.map((option) => <option key={option.slug} value={option.name}>{option.name}</option>)}</select></label>
              <label className="inventory-filter-field"><span>Fabricante</span><select value={manufacturerFilter} onChange={(event) => setManufacturerFilter(event.target.value)}><option value="">Todos os fabricantes</option>{manufacturerOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              <label className="inventory-filter-field"><span>Prazo de validade</span><select value={calibrationFilter} onChange={(event) => setCalibrationFilter(event.target.value as CalibrationFilter)}><option value="all">Todos</option><option value="neutral">Em dia</option><option value="warning">Vencendo</option><option value="danger">Vencido</option></select></label>
            </div>
            <div className="inventory-filters-actions"><button type="button" className="inventory-filters-clear" onClick={() => { setCategoryFilter(""); setManufacturerFilter(""); setCalibrationFilter("all"); }}>Limpar filtros</button></div>
          </section>
        ) : null}

        {loadError ? <section className="inventory-filters-card"><p className="inventory-table__empty">{loadError}</p></section> : null}

        <section className="inventory-table-card">
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th><button type="button" className={`inventory-sort-button${sortKey === "tag" ? " is-active" : ""}`} onClick={() => handleSort("tag")}><span>Tag</span><span className="inventory-sort-button__icon" aria-hidden="true">{sortKey === "tag" ? (sortDirection === "asc" ? "A-Z" : "Z-A") : "A-Z"}</span></button></th>
                  <th><button type="button" className={`inventory-sort-button${sortKey === "category" ? " is-active" : ""}`} onClick={() => handleSort("category")}><span>Categoria</span><span className="inventory-sort-button__icon" aria-hidden="true">{sortKey === "category" ? (sortDirection === "asc" ? "A-Z" : "Z-A") : "A-Z"}</span></button></th>
                  <th><button type="button" className={`inventory-sort-button${sortKey === "manufacturer" ? " is-active" : ""}`} onClick={() => handleSort("manufacturer")}><span>Fabricante</span><span className="inventory-sort-button__icon" aria-hidden="true">{sortKey === "manufacturer" ? (sortDirection === "asc" ? "A-Z" : "Z-A") : "A-Z"}</span></button></th>
                  <th><button type="button" className={`inventory-sort-button inventory-sort-button--calibration${sortKey === "calibration" ? " is-active" : ""}`} onClick={() => handleSort("calibration")}><span>Prazo de calibração</span><span className="inventory-sort-button__icon inventory-sort-button__icon--calibration" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="5.25" fill="currentColor" opacity="0.16" /><circle cx="9" cy="9" r="4.25" stroke="currentColor" strokeWidth="1.8" /><path d="M9 6.9v2.5l1.7 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d={sortKey === "calibration" && sortDirection === "desc" ? "m16.5 16.2 2.5-2.6 2.5 2.6" : "m16.5 13.8 2.5 2.6 2.5-2.6"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span></button></th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={5} className="inventory-table__empty">Carregando instrumentos...</td></tr> : null}
                {!isLoading && sortedRows.length === 0 ? <tr><td colSpan={5} className="inventory-table__empty">Nenhum instrumento encontrado com os filtros atuais.</td></tr> : null}
                {!isLoading ? sortedRows.map((row) => {
                  const { dateLabel, statusLabel } = getCalibrationDisplayParts(row.calibration);
                  return (
                    <tr key={row.id}>
                      <td data-label="Tag"><Link href={`/instrumentos/${row.id}`} className="tag-pill tag-pill--link">{row.tag}</Link></td>
                      <td data-label="Categoria">{row.category}</td>
                      <td data-label="Fabricante">{row.manufacturer}</td>
                      <td data-label="Prazo de calibração"><div className="calibration-cell"><span className={`calibration-cell__date calibration-cell__date--${row.tone}`}>{dateLabel}</span>{statusLabel ? <span className={`calibration-badge calibration-badge--${row.tone}`}>{statusLabel}</span> : null}</div></td>
                      <td data-label="Ações"><button type="button" className="table-action" aria-label="Editar" onClick={() => openEditModal(row)}><svg viewBox="0 0 24 24" fill="none"><path d="M4 16.8V20h3.2L18 9.2 14.8 6 4 16.8Z" fill="currentColor" /><path d="m13.8 7 3.2 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></button></td>
                    </tr>
                  );
                }) : null}
              </tbody>
            </table>
          </div>
          <div className="inventory-table-footer"><p>Carregados {sortedRows.length} de {filteredRows.length} itens</p></div>
        </section>
      </section>

      {isModalOpen ? (
        <div className="instrument-modal-backdrop" role="presentation" onClick={closeModal}>
          <section className="instrument-modal" role="dialog" aria-modal="true" aria-labelledby="instrument-modal-title" onClick={(event) => event.stopPropagation()}>
            <header className="instrument-modal__header">
              <h2 id="instrument-modal-title">{modalMode === "edit" ? "Editar Instrumento" : "Adicionar Novo Instrumento"}</h2>
              <button type="button" className="instrument-modal__close" aria-label="Fechar modal" onClick={closeModal}><svg viewBox="0 0 24 24" fill="none"><path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button>
            </header>

            <form className="instrument-modal__body" onSubmit={handleSubmit}>
              <div className="instrument-modal__content">
                <div className="instrument-modal__grid">
                  <label className="instrument-modal__field">
                    <span>Tag</span>
                    <input
                      type="text"
                      placeholder="Ex: DI-004"
                      className={validationErrors.tag ? "is-invalid" : undefined}
                      value={formState.tag}
                      onChange={(event) => {
                        setFormState((current) => ({ ...current, tag: event.target.value }));
                        setValidationErrors((current) => ({ ...current, tag: undefined, form: undefined }));
                      }}
                    />
                    {validationErrors.tag ? <small className="instrument-modal__field-error">{validationErrors.tag}</small> : null}
                  </label>

                  <label className="instrument-modal__field">
                    <span>Fabricante</span>
                    <input
                      type="text"
                      placeholder="Ex: Mitutoyo"
                      className={validationErrors.manufacturer ? "is-invalid" : undefined}
                      value={formState.manufacturer}
                      onChange={(event) => {
                        setFormState((current) => ({ ...current, manufacturer: event.target.value }));
                        setValidationErrors((current) => ({ ...current, manufacturer: undefined, form: undefined }));
                      }}
                    />
                    {validationErrors.manufacturer ? <small className="instrument-modal__field-error">{validationErrors.manufacturer}</small> : null}
                  </label>

                  <label className="instrument-modal__field">
                    <span>Prazo de calibracao</span>
                    <input
                      type="date"
                      className={validationErrors.calibrationDate ? "is-invalid" : undefined}
                      value={formState.calibrationDate}
                      onChange={(event) => {
                        setFormState((current) => ({ ...current, calibrationDate: event.target.value }));
                        setValidationErrors((current) => ({ ...current, calibrationDate: undefined, form: undefined }));
                      }}
                    />
                    {validationErrors.calibrationDate ? <small className="instrument-modal__field-error">{validationErrors.calibrationDate}</small> : null}
                  </label>

                  <div className="instrument-modal__field instrument-modal__field--category-builder">
                    <div className="instrument-modal__field-head">
                      <span>Categoria</span>
                      {!useNewCategory ? (
                        <button
                          type="button"
                          className="instrument-modal__link-button"
                          onClick={enableNewCategoryMode}
                          disabled={isLoadingMetadata || isLoadingInstrumentDetail}
                        >
                          Cadastrar nova categoria
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="instrument-modal__link-button"
                          onClick={disableNewCategoryMode}
                          disabled={isLoadingInstrumentDetail}
                        >
                          Usar categoria existente
                        </button>
                      )}
                    </div>

                    {!useNewCategory ? (
                      <>
                        <select
                          className={validationErrors.category ? "is-invalid" : undefined}
                          value={formState.category}
                          onChange={(event) => handleSelectCategory(event.target.value)}
                          disabled={isLoadingMetadata || isLoadingInstrumentDetail}
                        >
                          <option value="" disabled>{isLoadingMetadata ? "Carregando categorias..." : "Selecione uma categoria"}</option>
                          {categoryOptions.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}
                        </select>
                        {validationErrors.category ? <small className="instrument-modal__field-error">{validationErrors.category}</small> : <small className="instrument-modal__field-help">Ao selecionar uma categoria, os campos padrao sao carregados abaixo.</small>}
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Ex: Paquimetro"
                          className={validationErrors.newCategoryName ? "is-invalid" : undefined}
                          value={formState.newCategoryName}
                          onChange={(event) => {
                            setFormState((current) => ({ ...current, newCategoryName: event.target.value }));
                            setValidationErrors((current) => ({ ...current, newCategoryName: undefined, form: undefined }));
                          }}
                        />
                        {validationErrors.newCategoryName ? <small className="instrument-modal__field-error">{validationErrors.newCategoryName}</small> : <small className="instrument-modal__field-help">Os campos abaixo serao salvos como padrao da nova categoria.</small>}
                      </>
                    )}
                  </div>
                </div>

                <section className="instrument-fields-builder">
                  <div className="instrument-fields-builder__header">
                    <div>
                      <h3>Campos de medicao</h3>
                      <p>
                        {useNewCategory
                          ? "Defina os campos padrao da nova categoria e os valores que este instrumento vai herdar."
                          : selectedCategory
                            ? "Os campos padrao da categoria ja vieram carregados. Voce pode adicionar campos extras so para este instrumento."
                            : "Selecione uma categoria para puxar os campos padrao ou crie uma nova categoria agora."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="instrument-fields-builder__add"
                      onClick={handleAddField}
                      disabled={isLoadingInstrumentDetail || isLoadingMetadata || (!useNewCategory && !selectedCategory)}
                    >
                      Novo campo
                    </button>
                  </div>

                  {isLoadingInstrumentDetail ? (
                    <div className="instrument-fields-builder__empty">Carregando campos do instrumento...</div>
                  ) : fieldRows.length === 0 ? (
                    <div className="instrument-fields-builder__empty">
                      {useNewCategory
                        ? "Adicione o primeiro campo padrao da nova categoria."
                        : selectedCategory
                          ? "Essa categoria ainda nao possui campos padrao. Adicione os campos que este instrumento precisa."
                          : "Nenhum campo carregado ainda."}
                    </div>
                  ) : (
                    <div className="instrument-fields-builder__list">
                      {fieldRows.map((field, index) => {
                        const isCategoryDefault = field.source === "category" && !useNewCategory;

                        return (
                          <div key={field.clientId} className={`instrument-fields-builder__row${isCategoryDefault ? " is-locked" : ""}`}>
                            <div className="instrument-fields-builder__row-top">
                              <span className={`instrument-fields-builder__badge instrument-fields-builder__badge--${field.source}`}>{field.source === "category" ? "Padrao" : "Extra"}</span>
                              <strong>Campo {String(index + 1).padStart(2, "0")}</strong>
                              {!isCategoryDefault ? <button type="button" className="instrument-fields-builder__remove" onClick={() => removeFieldRow(field.clientId)}>Remover</button> : null}
                            </div>

                            <div className="instrument-fields-builder__row-grid">
                              <label className="instrument-modal__field">
                                <span>Nome do campo</span>
                                <input
                                  type="text"
                                  placeholder="Ex: Diametro interno"
                                  value={field.name}
                                  onChange={(event) => updateFieldRow(field.clientId, "name", event.target.value)}
                                  disabled={isCategoryDefault}
                                />
                              </label>

                              <label className="instrument-modal__field">
                                <span>Tipo de medida</span>
                                <select
                                  value={field.measurementId}
                                  onChange={(event) => updateFieldRow(field.clientId, "measurementId", event.target.value)}
                                  disabled={isCategoryDefault || isLoadingMetadata}
                                >
                                  <option value="" disabled>Selecione a medida</option>
                                  {measurements.map((measurement) => <option key={measurement.id} value={measurement.id}>{measurement.name}</option>)}
                                </select>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {validationErrors.fields ? <p className="instrument-modal__field-error instrument-fields-builder__error">{validationErrors.fields}</p> : null}
                </section>

                {validationErrors.form ? <p className="instrument-modal__field-error">{validationErrors.form}</p> : null}
              </div>
              <footer className="instrument-modal__footer">
                {modalMode === "edit" ? <button type="button" className="instrument-modal__delete" onClick={() => setIsDeleteConfirmOpen(true)} disabled={isSubmitting || isDeleting || isLoadingInstrumentDetail}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 7.5h15M9.5 3.75h5M9 10.5v5.25M15 10.5v5.25M7.5 7.5l.6 9a1.5 1.5 0 0 0 1.5 1.4h4.8a1.5 1.5 0 0 0 1.5-1.4l.6-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Apagar Instrumento</button> : null}
                <button type="button" className="instrument-modal__cancel" onClick={closeModal} disabled={isSubmitting || isDeleting}>Cancelar</button>
                <button type="submit" className="instrument-modal__submit" disabled={isSubmitting || isDeleting || isLoadingMetadata || isLoadingInstrumentDetail}>{isSubmitting ? "Salvando..." : modalMode === "edit" ? "Salvar Alteracoes" : "Salvar Instrumento"}</button>
              </footer>
            </form>
            {isDeleteConfirmOpen ? (
              <div className="instrument-delete-confirm-backdrop" role="presentation" onClick={() => !isDeleting && setIsDeleteConfirmOpen(false)}>
                <section className="instrument-delete-confirm" role="dialog" aria-modal="true" aria-labelledby="instrument-delete-confirm-title" onClick={(event) => event.stopPropagation()}>
                  <h3 id="instrument-delete-confirm-title">Confirmar exclusao</h3>
                  <p>Para apagar este instrumento, digite <strong>CONFIRMAR</strong> no campo abaixo.</p>
                  <input type="text" value={deleteConfirmationText} onChange={(event) => setDeleteConfirmationText(event.target.value)} placeholder="Digite CONFIRMAR" disabled={isDeleting} />
                  <div className="instrument-delete-confirm__actions">
                    <button type="button" onClick={() => !isDeleting && setIsDeleteConfirmOpen(false)} disabled={isDeleting}>Voltar</button>
                    <button type="button" className="is-danger" onClick={deleteInstrument} disabled={deleteConfirmationText.trim() !== "CONFIRMAR" || isDeleting}>{isDeleting ? "Excluindo..." : "Excluir Instrumento"}</button>
                  </div>
                </section>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
