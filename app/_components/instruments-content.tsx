"use client";

import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";

type InventoryRow = {
  tag: string;
  category: string;
  manufacturer: string;
  centerCostCode?: string;
  centerCostDescription?: string;
  calibration: string;
  calibrationDateValue?: string;
  tone: "neutral" | "warning" | "danger";
};

type InstrumentFormState = {
  tag: string;
  category: string;
  manufacturer: string;
  centerCostCode: string;
  centerCostDescription: string;
  calibrationDate: Date | null;
  fileName: string;
};

type InstrumentValidationErrors = Partial<
  Record<"tag" | "category" | "manufacturer" | "centerCostCode" | "calibrationDate", string>
>;

type CalibrationFilter = "all" | "neutral" | "warning" | "danger";
type SortKey = "tag" | "category" | "manufacturer" | "calibration";
type SortDirection = "asc" | "desc";

const INITIAL_VISIBLE_ROWS = 20;
const LOAD_MORE_ROWS = 20;
const LOAD_MORE_DELAY_MS = 260;
const LOAD_MORE_THRESHOLD_PX = 160;
const LOAD_MORE_PLACEHOLDER_ROWS = 4;
const ROW_ENTER_STAGGER_MS = 36;
const MAX_ROW_ENTER_STAGGER_STEPS = 3;
const EMPTY_FILE_LABEL = "Nenhum arquivo selecionado";

const rows: InventoryRow[] = [
  {
    tag: "PL-001",
    category: "Manômetro Digital",
    manufacturer: "WIKA Group",
    calibration: "12 Mar 2025 (Vence em 4 meses)",
    calibrationDateValue: "2025-03-12",
    tone: "neutral"
  },
  {
    tag: "PQ-042",
    category: "Paquímetro Digital",
    manufacturer: "Mitutoyo",
    calibration: "15 Out 2024 (Vence em 2 dias)",
    calibrationDateValue: "2024-10-15",
    tone: "warning"
  },
  {
    tag: "TM-088",
    category: "Termômetro Infravermelho",
    manufacturer: "Fluke Corp",
    calibration: "02 Jan 2025 (Vence em 2 meses)",
    calibrationDateValue: "2025-01-02",
    tone: "neutral"
  },
  {
    tag: "MG-012",
    category: "Micrômetro Externo",
    manufacturer: "Mitutoyo",
    calibration: "20 Ago 2024 (Vencido)",
    tone: "danger"
  }
];

const categoryOptions = [
  "Manômetro Digital",
  "Paquímetro Digital",
  "Termômetro Infravermelho",
  "Micrômetro Externo"
];

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric"
});

const shortMonthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const mockManufacturers = [
  "WIKA Group",
  "Mitutoyo",
  "Fluke Corp",
  "Instrutherm",
  "Novus",
  "Siemens",
  "WEG",
  "Emerson",
  "Phoenix Contact",
  "Yokogawa"
];

const mockCenterCosts = [
  { code: "3210300", description: "PRENSAS DE BORRACHA (1.09)" },
  { code: "3210100", description: "EXTRUSAO E LAMINACAO (1.05)" },
  { code: "1120103", description: "RECEPCAO" },
  { code: "1120104", description: "RESTAURANTE" },
  { code: "1120106", description: "LIMPEZA E HIGIENE" },
  { code: "1110102", description: "DIRETORIA INDUSTRIAL" },
  { code: "1120000", description: "TALENTOS HUMANOS" },
  { code: "2210100", description: "LABORATORIO DE QUALIDADE" }
];

const mockTagPrefixes = ["PL", "PQ", "TM", "MG"];
const calibrationOffsetsInDays = [-180, -120, -75, -20, -5, 3, 12, 24, 48, 75, 110, 160];

const calibrationDateByTag: Record<string, string> = {
  "PL-001": "2025-03-12",
  "PQ-042": "2024-10-15",
  "TM-088": "2025-01-02",
  "MG-012": "2024-08-20"
};

const emptyFormState: InstrumentFormState = {
  tag: "",
  category: "",
  manufacturer: "",
  centerCostCode: "",
  centerCostDescription: "",
  calibrationDate: null,
  fileName: EMPTY_FILE_LABEL
};

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function serializeDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createMockCalibrationDate(index: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const offset =
    calibrationOffsetsInDays[index % calibrationOffsetsInDays.length] +
    Math.floor(index / calibrationOffsetsInDays.length) * 2;

  const calibrationDate = new Date(today);
  calibrationDate.setDate(today.getDate() + offset);
  return calibrationDate;
}

function getRelativeCalibration(date: Date) {
  const today = new Date();
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffInDays = Math.ceil((targetDay.getTime() - currentDay.getTime()) / 86400000);

  if (diffInDays < 0) {
    return {
      tone: "danger" as const,
      description: "Vencido"
    };
  }

  if (diffInDays <= 30) {
    return {
      tone: "warning" as const,
      description: `Vence em ${diffInDays} ${diffInDays === 1 ? "dia" : "dias"}`
    };
  }

  const diffInMonths = Math.ceil(diffInDays / 30);
  return {
    tone: "neutral" as const,
    description: `Vence em ${diffInMonths} ${diffInMonths === 1 ? "mes" : "meses"}`
  };
}

function buildInventoryRow(formState: InstrumentFormState): InventoryRow {
  const calibrationDate = formState.calibrationDate ?? new Date();
  const relativeCalibration = getRelativeCalibration(calibrationDate);
  const day = String(calibrationDate.getDate()).padStart(2, "0");
  const month = shortMonthNames[calibrationDate.getMonth()];
  const year = calibrationDate.getFullYear();

  return {
    tag: formState.tag.trim(),
    category: formState.category,
    manufacturer: formState.manufacturer.trim(),
    centerCostCode: formState.centerCostCode.trim(),
    centerCostDescription: formState.centerCostDescription.trim(),
    calibration: `${day} ${month} ${year} (${relativeCalibration.description})`,
    calibrationDateValue: serializeDate(calibrationDate),
    tone: relativeCalibration.tone
  };
}

function createEditFormState(row: InventoryRow): InstrumentFormState {
  const calibrationDateValue =
    row.calibrationDateValue ?? mockCalibrationDateByTag[row.tag] ?? calibrationDateByTag[row.tag];

  return {
    tag: row.tag,
    category: row.category,
    manufacturer: row.manufacturer,
    centerCostCode: row.centerCostCode ?? "",
    centerCostDescription: row.centerCostDescription ?? "",
    calibrationDate: calibrationDateValue ? parseIsoDate(calibrationDateValue) : null,
    fileName: EMPTY_FILE_LABEL
  };
}

function formatDateValue(date: Date | null) {
  if (!date) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function isSameDay(first: Date | null, second: Date) {
  if (!first) return false;

  return (
    first.getDate() === second.getDate() &&
    first.getMonth() === second.getMonth() &&
    first.getFullYear() === second.getFullYear()
  );
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getCalibrationDisplayParts(value: string) {
  const match = value.match(/^(.*?)(?: \((.*)\))?$/);

  return {
    dateLabel: match?.[1] ?? value,
    statusLabel: match?.[2] ?? ""
  };
}

function getCalibrationTimestamp(row: InventoryRow) {
  const calibrationDateValue =
    row.calibrationDateValue ?? mockCalibrationDateByTag[row.tag] ?? calibrationDateByTag[row.tag];
  return calibrationDateValue ? parseIsoDate(calibrationDateValue).getTime() : 0;
}

const mockInventoryRows: InventoryRow[] = Array.from({ length: 100 }, (_, index) => {
  const calibrationDate = createMockCalibrationDate(index);
  const relativeCalibration = getRelativeCalibration(calibrationDate);
  const centerCost = mockCenterCosts[index % mockCenterCosts.length];
  const tag = `${mockTagPrefixes[index % mockTagPrefixes.length]}-${String(index + 1).padStart(3, "0")}`;
  const day = String(calibrationDate.getDate()).padStart(2, "0");
  const month = shortMonthNames[calibrationDate.getMonth()];
  const year = calibrationDate.getFullYear();

  return {
    tag,
    category: categoryOptions[index % categoryOptions.length],
    manufacturer: mockManufacturers[index % mockManufacturers.length],
    centerCostCode: centerCost.code,
    centerCostDescription: centerCost.description,
    calibration: `${day} ${month} ${year} (${relativeCalibration.description})`,
    calibrationDateValue: serializeDate(calibrationDate),
    tone: relativeCalibration.tone
  };
});

const mockCalibrationDateByTag: Record<string, string> = mockInventoryRows.reduce<Record<string, string>>(
  (result, row) => {
    if (row.calibrationDateValue) {
      result[row.tag] = row.calibrationDateValue;
    }

    return result;
  },
  {}
);

export function InstrumentsContent() {
  const [inventoryRows, setInventoryRows] = useState(mockInventoryRows);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [calibrationFilter, setCalibrationFilter] = useState<CalibrationFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [visibleRowsCount, setVisibleRowsCount] = useState(INITIAL_VISIBLE_ROWS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [formState, setFormState] = useState<InstrumentFormState>(() => ({ ...emptyFormState }));
  const [validationErrors, setValidationErrors] = useState<InstrumentValidationErrors>({});
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCenterCostLookupLoading, setIsCenterCostLookupLoading] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreTimeoutRef = useRef<number | null>(null);

  function clearLoadMoreTimeout() {
    if (loadMoreTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(loadMoreTimeoutRef.current);
    loadMoreTimeoutRef.current = null;
  }

  function scheduleLoadMore() {
    if (isLoadingMore || loadMoreTimeoutRef.current !== null || visibleRowsCount >= sortedRows.length) {
      return;
    }

    setIsLoadingMore(true);
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setVisibleRowsCount((current) => Math.min(current + LOAD_MORE_ROWS, sortedRows.length));
      setIsLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, LOAD_MORE_DELAY_MS);
  }

  function handleTableScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const remainingScroll = container.scrollHeight - container.scrollTop - container.clientHeight;

    if (remainingScroll <= LOAD_MORE_THRESHOLD_PX) {
      scheduleLoadMore();
    }
  }

  function openCreateModal() {
    const now = new Date();
    setModalMode("create");
    setEditingTag(null);
    setFormState({ ...emptyFormState });
    setValidationErrors({});
    setIsCalendarOpen(false);
    setIsCenterCostLookupLoading(false);
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setIsModalOpen(true);
  }

  function openEditModal(row: InventoryRow) {
    const nextFormState = createEditFormState(row);
    const fallbackDate = nextFormState.calibrationDate ?? new Date();
    setModalMode("edit");
    setEditingTag(row.tag);
    setFormState(nextFormState);
    setValidationErrors({});
    setIsCalendarOpen(false);
    setIsCenterCostLookupLoading(false);
    setVisibleMonth(new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1));
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsCategoryMenuOpen(false);
    setIsCalendarOpen(false);
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmationText("");
    setEditingTag(null);
    setValidationErrors({});
    setIsCenterCostLookupLoading(false);
    setIsModalOpen(false);
  }

  function openDeleteConfirm() {
    setIsCategoryMenuOpen(false);
    setIsCalendarOpen(false);
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(false);
  }

  function validateForm() {
    const nextErrors: InstrumentValidationErrors = {};

    if (!formState.tag.trim()) {
      nextErrors.tag = "Tag obrigatoria.";
    }

    if (!formState.category) {
      nextErrors.category = "Categoria obrigatoria.";
    }

    if (!formState.manufacturer.trim()) {
      nextErrors.manufacturer = "Fabricante obrigatorio.";
    }

    if (formState.centerCostCode.trim() && isCenterCostLookupLoading) {
      nextErrors.centerCostCode = "Aguarde a consulta do centro de custo.";
    } else if (formState.centerCostCode.trim() && !formState.centerCostDescription.trim()) {
      nextErrors.centerCostCode = "Informe um centro de custo valido.";
    }

    if (!formState.calibrationDate) {
      nextErrors.calibrationDate = "Prazo de calibracao obrigatorio.";
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    const nextRow = buildInventoryRow(formState);

    if (modalMode === "edit" && editingTag) {
      setInventoryRows((current) =>
        current.map((row) => (row.tag === editingTag ? nextRow : row))
      );
      closeModal();
      return;
    }

    setInventoryRows((current) => [
      nextRow,
      ...current.filter((row) => row.tag !== nextRow.tag)
    ]);
    closeModal();
  }

  function deleteInstrument() {
    if (!editingTag || deleteConfirmationText.trim() !== "CONFIRMAR") return;

    setInventoryRows((current) => current.filter((row) => row.tag !== editingTag));
    closeModal();
  }

  function clearFilters() {
    setCategoryFilter("");
    setManufacturerFilter("");
    setCalibrationFilter("all");
  }

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startWeekday);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return {
        date,
        isCurrentMonth: date.getMonth() === month
      };
    });
  }, [visibleMonth]);

  useEffect(() => {
    if (!isCalendarOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCalendarOpen]);

  useEffect(() => {
    if (!isCategoryMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCategoryMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCategoryMenuOpen]);

  useEffect(() => {
    if (!isModalOpen) return;

    const nextCenterCostCode = formState.centerCostCode.trim();

    if (!nextCenterCostCode) {
      setIsCenterCostLookupLoading(false);
      setFormState((current) => {
        if (!current.centerCostDescription) {
          return current;
        }

        return {
          ...current,
          centerCostDescription: ""
        };
      });
      setValidationErrors((current) => ({ ...current, centerCostCode: undefined }));
      return;
    }

    const abortController = new AbortController();
    let isCurrentLookup = true;
    setIsCenterCostLookupLoading(true);

    const lookupTimeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/centro-custo?code=${encodeURIComponent(nextCenterCostCode)}`,
          {
            method: "GET",
            signal: abortController.signal,
            cache: "no-store"
          }
        );

        if (!isCurrentLookup) {
          return;
        }

        const payload = (await response.json()) as {
          code?: string;
          description?: string;
          error?: string;
        };

        if (!response.ok) {
          setFormState((current) => ({
            ...current,
            centerCostDescription: ""
          }));
          setValidationErrors((current) => ({
            ...current,
            centerCostCode: payload.error ?? "Nao foi possivel consultar o centro de custo."
          }));
          setIsCenterCostLookupLoading(false);
          return;
        }

        setFormState((current) => ({
          ...current,
          centerCostDescription: payload.description?.trim() ?? ""
        }));
        setValidationErrors((current) => ({ ...current, centerCostCode: undefined }));
        setIsCenterCostLookupLoading(false);
      } catch (error) {
        if (!isCurrentLookup || abortController.signal.aborted) {
          return;
        }

        setFormState((current) => ({
          ...current,
          centerCostDescription: ""
        }));
        setValidationErrors((current) => ({
          ...current,
          centerCostCode: "Nao foi possivel consultar o centro de custo."
        }));
        setIsCenterCostLookupLoading(false);
      }
    }, 280);

    return () => {
      isCurrentLookup = false;
      abortController.abort();
      window.clearTimeout(lookupTimeout);
    };
  }, [formState.centerCostCode, isModalOpen]);

  const manufacturerOptions = useMemo(() => {
    return Array.from(new Set(inventoryRows.map((row) => row.manufacturer))).sort((first, second) =>
      first.localeCompare(second)
    );
  }, [inventoryRows]);

  const filteredRows = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);

    return inventoryRows.filter((row) => {
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
  }, [inventoryRows, searchTerm, categoryFilter, manufacturerFilter, calibrationFilter]);

  const sortedRows = useMemo(() => {
    if (!sortKey) {
      return filteredRows;
    }

    const directionFactor = sortDirection === "asc" ? 1 : -1;

    return [...filteredRows].sort((first, second) => {
      if (sortKey === "calibration") {
        return (getCalibrationTimestamp(first) - getCalibrationTimestamp(second)) * directionFactor;
      }

      const firstValue = normalizeSearchValue(first[sortKey]);
      const secondValue = normalizeSearchValue(second[sortKey]);

      return firstValue.localeCompare(secondValue, "pt-BR", { sensitivity: "base" }) * directionFactor;
    });
  }, [filteredRows, sortDirection, sortKey]);

  const visibleRows = useMemo(() => {
    return sortedRows.slice(0, visibleRowsCount);
  }, [sortedRows, visibleRowsCount]);

  const loadingPlaceholderCount = useMemo(() => {
    if (!isLoadingMore) {
      return 0;
    }

    return Math.min(LOAD_MORE_PLACEHOLDER_ROWS, Math.max(sortedRows.length - visibleRows.length, 0));
  }, [isLoadingMore, sortedRows.length, visibleRows.length]);

  const sortAnimationKey = `${sortKey ?? "default"}-${sortDirection}`;

  function getRowAnimationDelay(index: number) {
    const staggerStep = Math.min(index % LOAD_MORE_ROWS, MAX_ROW_ENTER_STAGGER_STEPS);
    return `${staggerStep * ROW_ENTER_STAGGER_MS}ms`;
  }

  useEffect(() => {
    clearLoadMoreTimeout();
    setVisibleRowsCount(INITIAL_VISIBLE_ROWS);
    setIsLoadingMore(false);
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = 0;
    }
  }, [searchTerm, categoryFilter, manufacturerFilter, calibrationFilter, sortKey, sortDirection]);

  useEffect(() => {
    const container = tableScrollRef.current;

    if (!container || isLoadingMore || visibleRowsCount >= sortedRows.length) {
      return;
    }

    const remainingScroll = container.scrollHeight - container.scrollTop - container.clientHeight;

    if (remainingScroll <= LOAD_MORE_THRESHOLD_PX) {
      scheduleLoadMore();
    }
  }, [isLoadingMore, sortedRows.length, visibleRows.length, visibleRowsCount]);

  useEffect(() => {
    return () => {
      clearLoadMoreTimeout();
    };
  }, []);

  return (
    <>
      <section className="inventory-content">
        <div className="inventory-actions">
          <label className="inventory-search">
            <span className="inventory-search__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="m16 16 4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Pesquisar instrumentos por Tag, Serial ou Categoria"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <button
            type="button"
            className={`toolbar-button${isFiltersOpen ? " is-active" : ""}`}
            onClick={() => setIsFiltersOpen((current) => !current)}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M5 7h14M8 12h8M10 17h4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Filtros
          </button>

          <button type="button" className="toolbar-button">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v9m0 0 4-4m-4 4-4-4M5 19h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Exportar CSV
          </button>

          <button
            type="button"
            className="primary-toolbar-button"
            onClick={openCreateModal}
          >
            <span className="primary-toolbar-button__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            Adicionar Novo Instrumento
          </button>
        </div>

        {isFiltersOpen ? (
          <section className="inventory-filters-card" aria-label="Filtros da tabela">
            <div className="inventory-filters-grid">
              <label className="inventory-filter-field">
                <span>Categoria</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="">Todas as categorias</option>
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="inventory-filter-field">
                <span>Fabricante</span>
                <select
                  value={manufacturerFilter}
                  onChange={(event) => setManufacturerFilter(event.target.value)}
                >
                  <option value="">Todos os fabricantes</option>
                  {manufacturerOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="inventory-filter-field">
                <span>Prazo de validade</span>
                <select
                  value={calibrationFilter}
                  onChange={(event) => setCalibrationFilter(event.target.value as CalibrationFilter)}
                >
                  <option value="all">Todos</option>
                  <option value="neutral">Em dia</option>
                  <option value="warning">Vencendo</option>
                  <option value="danger">Vencido</option>
                </select>
              </label>
            </div>

            <div className="inventory-filters-actions">
              <button type="button" className="inventory-filters-clear" onClick={clearFilters}>
                Limpar filtros
              </button>
            </div>
          </section>
        ) : null}

        <section className="inventory-table-card">
          <div
            ref={tableScrollRef}
            className="inventory-table-wrap"
            onScroll={handleTableScroll}
          >
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>
                    <button
                      type="button"
                      className={`inventory-sort-button${sortKey === "tag" ? " is-active" : ""}`}
                      onClick={() => handleSort("tag")}
                    >
                      <span>Tag</span>
                      <span className="inventory-sort-button__icon" aria-hidden="true">
                        {sortKey === "tag" ? (sortDirection === "asc" ? "A-Z" : "Z-A") : "A-Z"}
                      </span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className={`inventory-sort-button${sortKey === "category" ? " is-active" : ""}`}
                      onClick={() => handleSort("category")}
                    >
                      <span>Categoria</span>
                      <span className="inventory-sort-button__icon" aria-hidden="true">
                        {sortKey === "category" ? (sortDirection === "asc" ? "A-Z" : "Z-A") : "A-Z"}
                      </span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className={`inventory-sort-button${sortKey === "manufacturer" ? " is-active" : ""}`}
                      onClick={() => handleSort("manufacturer")}
                    >
                      <span>Fabricante</span>
                      <span className="inventory-sort-button__icon" aria-hidden="true">
                        {sortKey === "manufacturer" ? (sortDirection === "asc" ? "A-Z" : "Z-A") : "A-Z"}
                      </span>
                    </button>
                  </th>
                  <th>
                    <button
                      type="button"
                      className={`inventory-sort-button inventory-sort-button--calibration${sortKey === "calibration" ? " is-active" : ""}`}
                      onClick={() => handleSort("calibration")}
                    >
                      <span>Prazo de calibração</span>
                      <span
                        className="inventory-sort-button__icon inventory-sort-button__icon--calibration"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <circle cx="9" cy="9" r="5.25" fill="currentColor" opacity="0.16" />
                          <circle cx="9" cy="9" r="4.25" stroke="currentColor" strokeWidth="1.8" />
                          <path
                            d="M9 6.9v2.5l1.7 1"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d={
                              sortKey === "calibration" && sortDirection === "desc"
                                ? "m16.5 16.2 2.5-2.6 2.5 2.6"
                                : "m16.5 13.8 2.5 2.6 2.5-2.6"
                            }
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                  </th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody key={sortAnimationKey}>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="inventory-table__empty">
                      Nenhum instrumento encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : null}
                {visibleRows.map((row, index) => {
                  const { dateLabel, statusLabel } = getCalibrationDisplayParts(row.calibration);

                  return (
                    <tr
                      key={row.tag}
                      className="inventory-table__row--sort-transition"
                      style={{ animationDelay: getRowAnimationDelay(index) }}
                    >
                      <td data-label="Tag">
                        <span className="tag-pill">{row.tag}</span>
                      </td>
                      <td data-label="Categoria">{row.category}</td>
                      <td data-label="Fabricante">{row.manufacturer}</td>
                      <td data-label="Prazo de calibração">
                        <div className="calibration-cell">
                          <span className={`calibration-cell__date calibration-cell__date--${row.tone}`}>
                            {dateLabel}
                          </span>
                          {statusLabel ? (
                            <span className={`calibration-badge calibration-badge--${row.tone}`}>
                              {statusLabel}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td data-label="Ações">
                        <button
                          type="button"
                          className="table-action"
                          aria-label="Editar"
                          onClick={() => openEditModal(row)}
                        >
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M4 16.8V20h3.2L18 9.2 14.8 6 4 16.8Z" fill="currentColor" />
                            <path
                              d="m13.8 7 3.2 3.2"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {Array.from({ length: loadingPlaceholderCount }, (_, index) => (
                  <tr
                    key={`loading-row-${visibleRows.length + index}`}
                    className="inventory-table__row--loading"
                    aria-hidden="true"
                  >
                    <td data-label="Tag">
                      <span className="inventory-table__skeleton inventory-table__skeleton--tag" />
                    </td>
                    <td data-label="Categoria">
                      <span className="inventory-table__skeleton inventory-table__skeleton--text" />
                    </td>
                    <td data-label="Fabricante">
                      <span className="inventory-table__skeleton inventory-table__skeleton--text inventory-table__skeleton--text-short" />
                    </td>
                    <td data-label="Prazo de calibração">
                      <div className="calibration-cell">
                        <span className="inventory-table__skeleton inventory-table__skeleton--date" />
                        <span className="inventory-table__skeleton inventory-table__skeleton--badge" />
                      </div>
                    </td>
                    <td data-label="Ações">
                      <span className="inventory-table__skeleton inventory-table__skeleton--action" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="inventory-table-footer">
            <p>
              Carregados {visibleRows.length} de {filteredRows.length} itens
            </p>

            {visibleRows.length < filteredRows.length ? (
              isLoadingMore ? (
                <span className="inventory-table-footer__loading" role="status" aria-live="polite">
                  <span className="inventory-table-footer__loading-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  Carregando mais instrumentos
                </span>
              ) : (
                <span className="inventory-table-footer__hint">Role dentro da tabela para carregar mais</span>
              )
            ) : null}
          </div>
        </section>
      </section>

      {isModalOpen ? (
        <div
          className="instrument-modal-backdrop"
          role="presentation"
          onClick={closeModal}
        >
          <section
            className="instrument-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="instrument-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="instrument-modal__header">
              <h2 id="instrument-modal-title">
                {modalMode === "edit" ? "Editar Instrumento" : "Adicionar Novo Instrumento"}
              </h2>

              <button
                type="button"
                className="instrument-modal__close"
                aria-label="Fechar modal"
                onClick={closeModal}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6 18 18M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </header>

            <form
              className="instrument-modal__body"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <div className="instrument-modal__content">
                <div className="instrument-modal__grid">
                  <label className="instrument-modal__field">
                    <span>Tag</span>
                    <input
                      type="text"
                      placeholder="Ex: PL-001"
                      className={validationErrors.tag ? "is-invalid" : undefined}
                      value={formState.tag}
                      onChange={(event) =>
                        {
                          setFormState((current) => ({
                            ...current,
                            tag: event.target.value
                          }));
                          setValidationErrors((current) => ({ ...current, tag: undefined }));
                        }
                      }
                    />
                    {validationErrors.tag ? (
                      <small className="instrument-modal__field-error">{validationErrors.tag}</small>
                    ) : null}
                  </label>

                  <label className="instrument-modal__field">
                    <span>Categoria</span>
                    <div className="instrument-modal__select-wrap" ref={categoryMenuRef}>
                      <button
                        type="button"
                        className={`instrument-modal__select-trigger${
                          validationErrors.category ? " is-invalid" : ""
                        }`}
                        onClick={() => {
                          setIsCalendarOpen(false);
                          setIsCategoryMenuOpen((current) => !current);
                        }}
                        aria-expanded={isCategoryMenuOpen}
                        aria-haspopup="listbox"
                      >
                        <span
                          className={`instrument-modal__select-value${
                            formState.category ? "" : " is-placeholder"
                          }`}
                        >
                          {formState.category || "Selecione uma categoria"}
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="m7 10 5 5 5-5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      <select
                        className={`instrument-modal__select-native${
                          validationErrors.category ? " is-invalid" : ""
                        }`}
                        value={formState.category}
                        onChange={(event) =>
                          {
                            setFormState((current) => ({
                              ...current,
                              category: event.target.value
                            }));
                            setValidationErrors((current) => ({ ...current, category: undefined }));
                          }
                        }
                      >
                        <option value="" disabled>
                          Selecione uma categoria
                        </option>
                        <option>Manômetro Digital</option>
                        <option>Paquímetro Digital</option>
                        <option>Termômetro Infravermelho</option>
                        <option>Micrômetro Externo</option>
                      </select>
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="m7 10 5 5 5-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      {isCategoryMenuOpen ? (
                        <div className="instrument-modal__select-menu" role="listbox">
                          {categoryOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              className={`instrument-modal__select-option${
                                formState.category === option ? " is-selected" : ""
                              }`}
                              onClick={() => {
                                setFormState((current) => ({
                                  ...current,
                                  category: option
                                }));
                                setValidationErrors((current) => ({ ...current, category: undefined }));
                                setIsCategoryMenuOpen(false);
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    {validationErrors.category ? (
                      <small className="instrument-modal__field-error">{validationErrors.category}</small>
                    ) : null}
                  </label>

                  <label className="instrument-modal__field">
                    <span>Fabricante</span>
                    <input
                      type="text"
                      placeholder="Ex: WIKA Group"
                      className={validationErrors.manufacturer ? "is-invalid" : undefined}
                      value={formState.manufacturer}
                      onChange={(event) =>
                        {
                          setFormState((current) => ({
                            ...current,
                            manufacturer: event.target.value
                          }));
                          setValidationErrors((current) => ({
                            ...current,
                            manufacturer: undefined
                          }));
                        }
                      }
                    />
                    {validationErrors.manufacturer ? (
                      <small className="instrument-modal__field-error">
                        {validationErrors.manufacturer}
                      </small>
                    ) : null}
                  </label>

                  <label className="instrument-modal__field">
                    <span>Centro de custo</span>
                    <div
                      className={`instrument-modal__composed-input${
                        validationErrors.centerCostCode ? " is-invalid" : ""
                      }`}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ex: 3210300"
                        value={formState.centerCostCode}
                        onChange={(event) => {
                          const nextCenterCostCode = event.target.value.replace(/\s+/g, "");
                          setFormState((current) => ({
                            ...current,
                            centerCostCode: nextCenterCostCode,
                            centerCostDescription: ""
                          }));
                          setValidationErrors((current) => ({
                            ...current,
                            centerCostCode: undefined
                          }));
                        }}
                      />
                      <span className="instrument-modal__composed-separator" aria-hidden="true">
                        -
                      </span>
                      {formState.centerCostDescription || isCenterCostLookupLoading ? (
                        <>
                          <span
                            className={`instrument-modal__composed-prefix${
                              isCenterCostLookupLoading ? " is-placeholder" : ""
                            }`}
                          >
                            {isCenterCostLookupLoading
                              ? "Buscando centro de custo"
                              : formState.centerCostDescription}
                          </span>
                        </>
                      ) : null}
                    </div>
                    {validationErrors.centerCostCode ? (
                      <small className="instrument-modal__field-error">
                        {validationErrors.centerCostCode}
                      </small>
                    ) : null}
                  </label>

                  <label className="instrument-modal__field">
                    <span>Prazo de calibração</span>
                    <div className="instrument-modal__date-picker" ref={calendarRef}>
                      <button
                        type="button"
                        className={`instrument-modal__date-trigger${
                          validationErrors.calibrationDate ? " is-invalid" : ""
                        }`}
                        onClick={() => {
                          setIsCategoryMenuOpen(false);
                          setIsCalendarOpen((current) => !current);
                        }}
                        aria-expanded={isCalendarOpen}
                        aria-haspopup="dialog"
                      >
                        <span
                          className={`instrument-modal__date-value${
                            formState.calibrationDate ? "" : " is-placeholder"
                          }`}
                        >
                          {formState.calibrationDate
                            ? formatDateValue(formState.calibrationDate)
                            : "dd/mm/aaaa"}
                        </span>
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M7 4.75v2.5M17 4.75v2.5M5.75 8.25h12.5M7 6h10a1.25 1.25 0 0 1 1.25 1.25v10A1.75 1.75 0 0 1 16.5 19h-9A1.75 1.75 0 0 1 5.75 17.25v-10A1.25 1.25 0 0 1 7 6Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {isCalendarOpen ? (
                        <div className="instrument-modal__calendar" role="dialog" aria-label="Calendário">
                          <div className="instrument-modal__calendar-header">
                            <button
                              type="button"
                              className="instrument-modal__calendar-nav"
                              aria-label="Mês anterior"
                              onClick={() =>
                                setVisibleMonth(
                                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
                                )
                              }
                            >
                              <svg viewBox="0 0 24 24" fill="none">
                                <path
                                  d="m14 7-5 5 5 5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                            <strong>{monthFormatter.format(visibleMonth)}</strong>

                            <button
                              type="button"
                              className="instrument-modal__calendar-nav"
                              aria-label="Próximo mês"
                              onClick={() =>
                                setVisibleMonth(
                                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
                                )
                              }
                            >
                              <svg viewBox="0 0 24 24" fill="none">
                                <path
                                  d="m10 7 5 5-5 5"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="instrument-modal__calendar-weekdays">
                            {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
                              <span key={`${day}-${index}`}>{day}</span>
                            ))}
                          </div>

                          <div className="instrument-modal__calendar-grid">
                            {calendarDays.map(({ date, isCurrentMonth }) => (
                              <button
                                key={date.toISOString()}
                                type="button"
                                className={`instrument-modal__calendar-day${
                                  isCurrentMonth ? "" : " is-muted"
                                }${isSameDay(formState.calibrationDate, date) ? " is-selected" : ""}`}
                                onClick={() => {
                                  setFormState((current) => ({
                                    ...current,
                                    calibrationDate: date
                                  }));
                                  setValidationErrors((current) => ({
                                    ...current,
                                    calibrationDate: undefined
                                  }));
                                  setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                                  setIsCalendarOpen(false);
                                }}
                              >
                                {date.getDate()}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    {validationErrors.calibrationDate ? (
                      <small className="instrument-modal__field-error">
                        {validationErrors.calibrationDate}
                      </small>
                    ) : null}
                  </label>
                </div>

                <label className="instrument-modal__field instrument-modal__field--full">
                  <span>Certificado de calibração</span>
                  <div className="instrument-modal__file">
                    <input
                      id="instrument-certificate"
                      type="file"
                      onChange={(event) => {
                        const nextFile = event.target.files?.[0];
                        setFormState((current) => ({
                          ...current,
                          fileName: nextFile?.name ?? EMPTY_FILE_LABEL
                        }));
                      }}
                    />
                    <label htmlFor="instrument-certificate" className="instrument-modal__file-button">
                      Escolher arquivo
                    </label>
                    <span className="instrument-modal__file-name">{formState.fileName}</span>
                  </div>
                </label>
              </div>

              <footer className="instrument-modal__footer">
                {modalMode === "edit" ? (
                  <button
                    type="button"
                    className="instrument-modal__delete"
                    onClick={openDeleteConfirm}
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M4.5 7.5h15M9.5 3.75h5M9 10.5v5.25M15 10.5v5.25M7.5 7.5l.6 9a1.5 1.5 0 0 0 1.5 1.4h4.8a1.5 1.5 0 0 0 1.5-1.4l.6-9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Apagar Instrumento
                  </button>
                ) : null}
                <button
                  type="button"
                  className="instrument-modal__cancel"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="instrument-modal__submit">
                  {modalMode === "edit" ? "Salvar Alteracoes" : "Salvar Instrumento"}
                </button>
              </footer>
            </form>

            {isDeleteConfirmOpen ? (
              <div
                className="instrument-delete-confirm-backdrop"
                role="presentation"
                onClick={closeDeleteConfirm}
              >
                <section
                  className="instrument-delete-confirm"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="instrument-delete-confirm-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h3 id="instrument-delete-confirm-title">Confirmar exclusao</h3>
                  <p>
                    Para apagar este instrumento, digite <strong>CONFIRMAR</strong> no campo abaixo.
                  </p>

                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(event) => setDeleteConfirmationText(event.target.value)}
                    placeholder="Digite CONFIRMAR"
                  />

                  <div className="instrument-delete-confirm__actions">
                    <button type="button" onClick={closeDeleteConfirm}>
                      Voltar
                    </button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={deleteInstrument}
                      disabled={deleteConfirmationText.trim() !== "CONFIRMAR"}
                    >
                      Excluir Instrumento
                    </button>
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
