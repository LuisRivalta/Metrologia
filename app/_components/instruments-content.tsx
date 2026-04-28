"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api/client";
import type { InstrumentDetailItem, InstrumentItem } from "@/lib/instruments";
import type { MeasurementFieldItem } from "@/lib/measurement-fields";
import type { MeasurementItem } from "@/lib/measurements";
import { formatSetorLabel, type SetorItem } from "@/lib/setores";
import { DefaultFieldPreviewTable } from "./default-field-preview-table";
import { PageTransitionLink } from "./page-transition-link";

type InstrumentFormState = {
  tag: string;
  category: string;
  newCategoryName: string;
  manufacturer: string;
  calibrationDate: string;
  setorId: number | null;
};

type InstrumentFieldFormItem = {
  clientId: string;
  name: string;
  measurementId: string;
  groupName?: string;
  subgroupName?: string;
  currentValue?: string;
  currentValueUnit?: string;
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

const VALID_CALIBRATION_FILTER_STATUSES: CalibrationFilter[] = ["neutral", "warning", "danger"];

type InstrumentApiResponse = {
  error?: string;
  item?: InstrumentItem;
  items?: InstrumentItem[];
  success?: boolean;
};

type InstrumentDetailApiResponse = {
  error?: string;
  item?: InstrumentDetailItem;
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
  calibrationDate: "",
  setorId: null
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
    groupName: field.groupName,
    subgroupName: field.subgroupName,
    currentValue: "",
    currentValueUnit: ""
  };
}

function mapInstrumentDetailFieldToFormItem(
  field: InstrumentDetailItem["fields"][number]
): InstrumentFieldFormItem {
  return {
    clientId: createClientId(),
    name: field.name,
    measurementId: field.measurementId,
    groupName: field.groupName,
    subgroupName: field.subgroupName,
    currentValue: field.latestValue,
    currentValueUnit: field.latestUnit
  };
}

export function InstrumentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialStatus = searchParams.get("status");
  const initialCategory = searchParams.get("category") ?? "";
  const initialManufacturer = searchParams.get("manufacturer") ?? "";
  const initialSetor = searchParams.get("setor") ?? "";

  const [rows, setRows] = useState<InstrumentItem[]>([]);
  const [setores, setSetores] = useState<SetorItem[]>([]);
  const [metadataCategories, setMetadataCategories] = useState<InstrumentMetadataCategory[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [manufacturerFilter, setManufacturerFilter] = useState(initialManufacturer);
  const [setorFilter, setSetorFilter] = useState(initialSetor);
  const [calibrationFilter, setCalibrationFilter] = useState<CalibrationFilter>(
    VALID_CALIBRATION_FILTER_STATUSES.includes(initialStatus as CalibrationFilter)
      ? (initialStatus as CalibrationFilter)
      : "all"
  );
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingInstrumentId, setEditingInstrumentId] = useState<number | null>(null);
  const [editingInitialCategorySlug, setEditingInitialCategorySlug] = useState("");
  const [formState, setFormState] = useState<InstrumentFormState>(emptyFormState);
  const [fieldRows, setFieldRows] = useState<InstrumentFieldFormItem[]>([]);
  const [isLoadingFieldValues, setIsLoadingFieldValues] = useState(false);
  const [validationErrors, setValidationErrors] = useState<InstrumentValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryOptions = useMemo(() => metadataCategories, [metadataCategories]);
  const selectedCategory = useMemo(
    () => metadataCategories.find((category) => category.slug === formState.category),
    [formState.category, metadataCategories]
  );
  const manufacturerOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.manufacturer))).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })),
    [rows]
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
      const matchesSetor =
        !setorFilter ||
        (setorFilter === "none" ? row.setor === null : row.setor?.id === Number(setorFilter));
      return matchesSearch && matchesCategory && matchesManufacturer && matchesCalibration && matchesSetor;
    });
  }, [rows, searchTerm, categoryFilter, manufacturerFilter, calibrationFilter, setorFilter]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const directionFactor = sortDirection === "asc" ? 1 : -1;
    return [...filteredRows].sort((first, second) => {
      if (sortKey === "calibration") return (getCalibrationTimestamp(first) - getCalibrationTimestamp(second)) * directionFactor;
      return normalizeSearchValue(first[sortKey]).localeCompare(normalizeSearchValue(second[sortKey]), "pt-BR", { sensitivity: "base" }) * directionFactor;
    });
  }, [filteredRows, sortDirection, sortKey]);

  function syncFiltersToURL(filters: {
    calibrationFilter: CalibrationFilter;
    categoryFilter: string;
    manufacturerFilter: string;
    setorFilter: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (filters.calibrationFilter === "all") { params.delete("status"); } else { params.set("status", filters.calibrationFilter); }
    if (filters.categoryFilter === "") { params.delete("category"); } else { params.set("category", filters.categoryFilter); }
    if (filters.manufacturerFilter === "") { params.delete("manufacturer"); } else { params.set("manufacturer", filters.manufacturerFilter); }
    if (filters.setorFilter === "") { params.delete("setor"); } else { params.set("setor", filters.setorFilter); }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (calibrationFilter !== "all") {
      const labels: Record<string, string> = { neutral: "Em dia", warning: "Vencendo", danger: "Vencido" };
      chips.push({
        key: "calibration",
        label: labels[calibrationFilter] ?? calibrationFilter,
        onRemove: () => {
          setCalibrationFilter("all");
          syncFiltersToURL({ calibrationFilter: "all", categoryFilter, manufacturerFilter, setorFilter });
        }
      });
    }

    if (categoryFilter) {
      chips.push({
        key: "category",
        label: categoryFilter,
        onRemove: () => {
          setCategoryFilter("");
          syncFiltersToURL({ calibrationFilter, categoryFilter: "", manufacturerFilter, setorFilter });
        }
      });
    }

    if (manufacturerFilter) {
      chips.push({
        key: "manufacturer",
        label: manufacturerFilter,
        onRemove: () => {
          setManufacturerFilter("");
          syncFiltersToURL({ calibrationFilter, categoryFilter, manufacturerFilter: "", setorFilter });
        }
      });
    }

    if (setorFilter) {
      const setorItem = setores.find((s) => String(s.id) === setorFilter);
      const label = setorFilter === "none" ? "Sem setor" : (setorItem ? formatSetorLabel(setorItem) : setorFilter);
      chips.push({
        key: "setor",
        label,
        onRemove: () => {
          setSetorFilter("");
          syncFiltersToURL({ calibrationFilter, categoryFilter, manufacturerFilter, setorFilter: "" });
        }
      });
    }

    return chips;
  }, [calibrationFilter, categoryFilter, manufacturerFilter, setorFilter, setores]);

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_INSTRUMENTS_STORAGE_KEY);
    void Promise.all([loadInstruments(), loadInstrumentMetadata()]);
  }, []);

  useEffect(() => {
    void loadSetores();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setFieldRows([]);
      return;
    }

    if (
      isModalOpen &&
      modalMode === "edit" &&
      formState.category === editingInitialCategorySlug
    ) {
      return;
    }

    setFieldRows(selectedCategory.fields.map(mapFieldToFormItem));
  }, [editingInitialCategorySlug, formState.category, isModalOpen, modalMode, selectedCategory]);

  async function loadInstruments() {
    setIsLoading(true);
    try {
      const response = await fetchApi("/api/instrumentos", { method: "GET", cache: "no-store" });
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
      const response = await fetchApi("/api/instrumentos/metadata", {
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

  async function loadSetores() {
    try {
      const response = await fetchApi("/api/setores", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as { items?: SetorItem[] };
      setSetores(payload.items ?? []);
    } catch {
      // setores são opcionais — falha silenciosa
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
    setEditingInitialCategorySlug("");
    setValidationErrors({});
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(false);
    setFormState({ ...emptyFormState });
    setFieldRows([]);
    setIsLoadingFieldValues(false);
  }

  function openEditModal(row: InstrumentItem) {
    resetModalState();
    setModalMode("edit");
    setEditingInstrumentId(row.id);
    setEditingInitialCategorySlug(row.categorySlug ?? "");
    setFormState({
      tag: row.tag,
      category: row.categorySlug ?? "",
      newCategoryName: "",
      manufacturer: row.manufacturer === "Não informado" ? "" : row.manufacturer,
      calibrationDate: row.calibrationDateValue ?? "",
      setorId: row.setor?.id ?? null
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSubmitting || isDeleting) return;

    setIsModalOpen(false);
    resetModalState();
  }

  function handleSelectCategory(categorySlug: string) {
    setFormState((current) => ({
      ...current,
      category: categorySlug
    }));
    setValidationErrors((current) => ({
      ...current,
      category: undefined,
      fields: undefined,
      form: undefined
    }));
  }

  useEffect(() => {
    if (
      !isModalOpen ||
      modalMode !== "edit" ||
      editingInstrumentId === null ||
      formState.category !== editingInitialCategorySlug
    ) {
      setIsLoadingFieldValues(false);
      return;
    }

    let isActive = true;

    async function loadInstrumentDetail() {
      setIsLoadingFieldValues(true);

      try {
        const response = await fetchApi(`/api/instrumentos?id=${editingInstrumentId}`, {
          method: "GET",
          cache: "no-store"
        });
        const payload = (await response.json()) as InstrumentDetailApiResponse;

        if (!isActive) {
          return;
        }

        if (response.ok && payload.item) {
          setFieldRows(payload.item.fields.map(mapInstrumentDetailFieldToFormItem));
        }
      } finally {
        if (isActive) {
          setIsLoadingFieldValues(false);
        }
      }
    }

    void loadInstrumentDetail();

    return () => {
      isActive = false;
    };
  }, [
    editingInitialCategorySlug,
    editingInstrumentId,
    formState.category,
    isModalOpen,
    modalMode
  ]);

  function validateForm() {
    const nextErrors: InstrumentValidationErrors = {};
    if (!formState.tag.trim()) nextErrors.tag = "Tag obrigatoria.";
    if (!formState.category) {
      nextErrors.category = "Categoria obrigatoria.";
    }
    if (!formState.calibrationDate) nextErrors.calibrationDate = "Prazo de calibracao obrigatorio.";
    if (!selectedCategory || selectedCategory.fields.length === 0) {
      nextErrors.fields =
        "A categoria precisa ter pelo menos um item no template de calibracao antes de salvar este instrumento.";
    }
    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await fetchApi("/api/instrumentos", {
        method: modalMode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingInstrumentId,
          tag: formState.tag.trim(),
          category: formState.category,
          manufacturer: formState.manufacturer.trim(),
          calibrationDate: formState.calibrationDate,
          setorId: formState.setorId
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
      const response = await fetchApi("/api/instrumentos", {
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
          <PageTransitionLink href="/instrumentos/novo" className="primary-toolbar-button">
            <span className="primary-toolbar-button__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></span>
            Adicionar Novo Instrumento
          </PageTransitionLink>
        </div>

        {isFiltersOpen ? (
          <section className="inventory-filters-card" aria-label="Filtros da tabela">
            <div className="inventory-filters-grid">
              <label className="inventory-filter-field"><span>Categoria</span><select value={categoryFilter} onChange={(event) => { const next = event.target.value; setCategoryFilter(next); syncFiltersToURL({ calibrationFilter, categoryFilter: next, manufacturerFilter, setorFilter }); }}><option value="">Todas as categorias</option>{categoryOptions.map((option) => <option key={option.slug} value={option.name}>{option.name}</option>)}</select></label>
              <label className="inventory-filter-field"><span>Fabricante</span><select value={manufacturerFilter} onChange={(event) => { const next = event.target.value; setManufacturerFilter(next); syncFiltersToURL({ calibrationFilter, categoryFilter, manufacturerFilter: next, setorFilter }); }}><option value="">Todos os fabricantes</option>{manufacturerOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              <label className="inventory-filter-field">
                <span>Setor</span>
                <select value={setorFilter} onChange={(event) => { const next = event.target.value; setSetorFilter(next); syncFiltersToURL({ calibrationFilter, categoryFilter, manufacturerFilter, setorFilter: next }); }}>
                  <option value="">Todos os setores</option>
                  <option value="none">Sem setor</option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>{formatSetorLabel(setor)}</option>
                  ))}
                </select>
              </label>
              <label className="inventory-filter-field"><span>Prazo de validade</span><select value={calibrationFilter} onChange={(event) => { const next = event.target.value as CalibrationFilter; setCalibrationFilter(next); syncFiltersToURL({ calibrationFilter: next, categoryFilter, manufacturerFilter, setorFilter }); }}><option value="all">Todos</option><option value="neutral">Em dia</option><option value="warning">Vencendo</option><option value="danger">Vencido</option></select></label>
            </div>
            <div className="inventory-filters-actions"><button type="button" className="inventory-filters-clear" onClick={() => { setCategoryFilter(""); setManufacturerFilter(""); setSetorFilter(""); setCalibrationFilter("all"); syncFiltersToURL({ calibrationFilter: "all", categoryFilter: "", manufacturerFilter: "", setorFilter: "" }); }}>Limpar filtros</button></div>
          </section>
        ) : null}

        {activeChips.length > 0 ? (
          <div className="filter-chips">
            {activeChips.map((chip) => (
              <span key={chip.key} className="filter-chip">
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remover filtro ${chip.label}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              className="filter-chips__clear"
              onClick={() => {
                setCategoryFilter("");
                setManufacturerFilter("");
                setSetorFilter("");
                setCalibrationFilter("all");
                syncFiltersToURL({ calibrationFilter: "all", categoryFilter: "", manufacturerFilter: "", setorFilter: "" });
              }}
            >
              Limpar tudo
            </button>
          </div>
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
                  <th>Setor</th>
                  <th><button type="button" className={`inventory-sort-button inventory-sort-button--calibration${sortKey === "calibration" ? " is-active" : ""}`} onClick={() => handleSort("calibration")}><span>Prazo de calibração</span><span className="inventory-sort-button__icon inventory-sort-button__icon--calibration" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="5.25" fill="currentColor" opacity="0.16" /><circle cx="9" cy="9" r="4.25" stroke="currentColor" strokeWidth="1.8" /><path d="M9 6.9v2.5l1.7 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d={sortKey === "calibration" && sortDirection === "desc" ? "m16.5 16.2 2.5-2.6 2.5 2.6" : "m16.5 13.8 2.5 2.6 2.5-2.6"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></span></button></th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={6} className="inventory-table__empty">Carregando instrumentos...</td></tr> : null}
                {!isLoading && sortedRows.length === 0 ? <tr><td colSpan={6} className="inventory-table__empty">Nenhum instrumento encontrado com os filtros atuais.</td></tr> : null}
                {!isLoading ? sortedRows.map((row) => {
                  const { dateLabel, statusLabel } = getCalibrationDisplayParts(row.calibration);
                  return (
                    <tr
                      key={row.id}
                      className="inventory-table__row--clickable"
                      onClick={() => router.push(`/instrumentos/${row.id}`)}
                    >
                      <td data-label="Tag"><PageTransitionLink href={`/instrumentos/${row.id}`} className="tag-pill tag-pill--link" onClick={e => e.stopPropagation()}>{row.tag}</PageTransitionLink></td>
                      <td data-label="Categoria">{row.category}</td>
                      <td data-label="Fabricante">{row.manufacturer}</td>
                      <td data-label="Setor">
                        {row.setor ? formatSetorLabel(row.setor) : <span className="inventory-table__empty-cell">Sem setor</span>}
                      </td>
                      <td data-label="Prazo de calibração"><div className="calibration-cell"><span className={`calibration-cell__date calibration-cell__date--${row.tone}`}>{dateLabel}</span>{statusLabel ? <span className={`calibration-badge calibration-badge--${row.tone}`}>{statusLabel}</span> : null}</div></td>
                      <td data-label="Ações">
                        <div onClick={e => e.stopPropagation()}>
                          <button type="button" className="table-action" aria-label="Editar" onClick={() => openEditModal(row)}>
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M4 16.8V20h3.2L18 9.2 14.8 6 4 16.8Z" fill="currentColor" />
                              <path d="m13.8 7 3.2 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                          </button>
                          <PageTransitionLink
                            href={`/instrumentos/${row.id}/calibracoes/nova`}
                            className="table-action"
                            aria-label="Registrar calibração"
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M14 3v6h6M12 11v6M9 14h6"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </PageTransitionLink>
                        </div>
                      </td>
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
                    <span>Fabricante (opcional)</span>
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
                    {validationErrors.manufacturer ? <small className="instrument-modal__field-error">{validationErrors.manufacturer}</small> : <small className="instrument-modal__field-help">Se nao informar, o instrumento sera salvo como nao informado.</small>}
                  </label>

                  <label className="instrument-modal__field instrument-modal__field--full">
                    <span>Setor de uso</span>
                    <select
                      value={formState.setorId ?? ""}
                      onChange={(event) => {
                        const val = event.target.value;
                        setFormState((current) => ({
                          ...current,
                          setorId: val === "" ? null : Number(val)
                        }));
                      }}
                    >
                      <option value="">Sem setor definido</option>
                      {setores.map((setor) => (
                        <option key={setor.id} value={setor.id}>
                          {setor.codigo} – {setor.nome}
                        </option>
                      ))}
                    </select>
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
                      <PageTransitionLink href="/categorias" className="instrument-modal__link-button">
                        Gerenciar categorias
                      </PageTransitionLink>
                    </div>

                    <select
                      className={validationErrors.category ? "is-invalid" : undefined}
                      value={formState.category}
                      onChange={(event) => handleSelectCategory(event.target.value)}
                      disabled={isLoadingMetadata}
                    >
                      <option value="" disabled>{isLoadingMetadata ? "Carregando categorias..." : "Selecione uma categoria"}</option>
                      {categoryOptions.map((option) => <option key={option.slug} value={option.slug}>{option.name}</option>)}
                    </select>
                    {validationErrors.category ? <small className="instrument-modal__field-error">{validationErrors.category}</small> : null}
                  </div>
                </div>

                <section className="instrument-fields-builder">
                  <div className="instrument-fields-builder__header">
                    <div>
                      <h3>Template de calibracao da categoria</h3>
                    </div>
                  </div>

                  {modalMode === "edit" && isLoadingFieldValues ? (
                    <p className="instrument-fields-builder__loading">
                      Carregando valores atuais do instrumento...
                    </p>
                  ) : null}

                  <DefaultFieldPreviewTable
                    fields={fieldRows.map((field) => ({
                      key: field.clientId,
                      name: field.name,
                      measurementId: field.measurementId,
                      groupName: field.groupName,
                      subgroupName: field.subgroupName,
                      currentValue: field.currentValue,
                      currentValueUnit: field.currentValueUnit
                    }))}
                    measurements={measurements}
                    showCurrentValue={modalMode === "edit"}
                    showCompactCopy={false}
                    emptyMessage={
                      selectedCategory
                        ? "Essa categoria ainda nao possui um template de calibracao cadastrado."
                        : "Selecione uma categoria para visualizar o template de calibracao."
                    }
                  />

                  {validationErrors.fields ? <p className="instrument-modal__field-error instrument-fields-builder__error">{validationErrors.fields}</p> : null}
                </section>

                {validationErrors.form ? <p className="instrument-modal__field-error">{validationErrors.form}</p> : null}
              </div>
              <footer className="instrument-modal__footer">
                {modalMode === "edit" ? <button type="button" className="instrument-modal__delete" onClick={() => setIsDeleteConfirmOpen(true)} disabled={isSubmitting || isDeleting}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 7.5h15M9.5 3.75h5M9 10.5v5.25M15 10.5v5.25M7.5 7.5l.6 9a1.5 1.5 0 0 0 1.5 1.4h4.8a1.5 1.5 0 0 0 1.5-1.4l.6-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>Apagar Instrumento</button> : null}
                <button type="button" className="instrument-modal__cancel" onClick={closeModal} disabled={isSubmitting || isDeleting}>Cancelar</button>
                <button type="submit" className="instrument-modal__submit" disabled={isSubmitting || isDeleting || isLoadingMetadata}>{isSubmitting ? "Salvando..." : modalMode === "edit" ? "Salvar Alteracoes" : "Salvar Instrumento"}</button>
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
