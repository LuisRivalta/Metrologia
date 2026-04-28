"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { fetchApi } from "@/lib/api/client";
import type { CategoryItem } from "@/lib/categories";
import {
  groupMeasurementFieldsByLayout,
  hasMeasurementFieldGrouping,
  serializeMeasurementFieldSlug
} from "@/lib/measurement-fields";
import type { MeasurementItem } from "@/lib/measurements";

type CategoryModalMode = "create" | "edit";
type CategoryFieldModalMode = "create" | "edit";

type CategoryFieldFormItem = {
  clientId: string;
  dbId?: number;
  name: string;
  measurementId: string;
  groupName: string;
  subgroupName: string;
  hint: string;
};

type CategoryFieldDraftRow = {
  clientId: string;
  dbId?: number;
  name: string;
  measurementId: string;
  hint: string;
};

type CategoryFieldDraftSubgroup = {
  clientId: string;
  name: string;
  defaultMeasurementId: string;
  rows: CategoryFieldDraftRow[];
};

type CategoryApiResponse = {
  error?: string;
  item?: CategoryItem;
  items?: CategoryItem[];
  measurements?: MeasurementItem[];
  success?: boolean;
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mapFieldToFormItem(field: CategoryItem["fields"][number]): CategoryFieldFormItem {
  return {
    clientId: createClientId(),
    dbId: field.dbId,
    name: field.name,
    measurementId: field.measurementId,
    groupName: field.groupName ?? "",
    subgroupName: field.subgroupName ?? "",
    hint: field.hint ?? ""
  };
}

function createFieldDraftRow(): CategoryFieldDraftRow {
  return {
    clientId: createClientId(),
    name: "",
    measurementId: "",
    hint: ""
  };
}

function createFieldDraftSubgroup(name = ""): CategoryFieldDraftSubgroup {
  return {
    clientId: createClientId(),
    name,
    defaultMeasurementId: "",
    rows: [createFieldDraftRow()]
  };
}

function mapFieldToDraftRow(field: CategoryFieldFormItem): CategoryFieldDraftRow {
  return {
    clientId: field.clientId,
    dbId: field.dbId,
    name: field.name,
    measurementId: field.measurementId,
    hint: field.hint
  };
}

function mapFieldsToDraftSubgroups(fields: CategoryFieldFormItem[]) {
  if (fields.length === 0) {
    return [createFieldDraftSubgroup()];
  }

  const subgroups = new Map<string, CategoryFieldDraftSubgroup>();

  for (const field of fields) {
    const subgroupName = field.subgroupName ?? "";
    const subgroupKey = normalizeSearchValue(subgroupName) || "__blank__";
    const currentSubgroup = subgroups.get(subgroupKey) ?? {
      clientId: createClientId(),
      name: subgroupName,
      defaultMeasurementId: "",
      rows: []
    };

    currentSubgroup.rows.push(mapFieldToDraftRow(field));
    subgroups.set(subgroupKey, currentSubgroup);
  }

  return [...subgroups.values()];
}

function getSubgroupGridClassName(count: number) {
  return count <= 1
    ? "template-preview__subgroups template-preview__subgroups--single"
    : "template-preview__subgroups";
}

function getFieldGridClassName(count: number) {
  if (count <= 1) {
    return "template-preview__fields template-preview__fields--single";
  }

  if (count === 2 || count === 4) {
    return "template-preview__fields template-preview__fields--double";
  }

  return "template-preview__fields template-preview__fields--triple";
}

export function CategoriesContent() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<CategoryModalMode>("create");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [fieldRows, setFieldRows] = useState<CategoryFieldFormItem[]>([]);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldModalMode, setFieldModalMode] = useState<CategoryFieldModalMode>("create");
  const [editingFieldClientIds, setEditingFieldClientIds] = useState<string[]>([]);
  const [fieldDraftSubgroups, setFieldDraftSubgroups] = useState<CategoryFieldDraftSubgroup[]>([]);
  const [fieldDraftGroupName, setFieldDraftGroupName] = useState("");
  const [fieldModalError, setFieldModalError] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<CategoryItem | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isCopyGroupModalOpen, setIsCopyGroupModalOpen] = useState(false);
  const [copyGroupSourceLabel, setCopyGroupSourceLabel] = useState("");
  const [copyGroupNewName, setCopyGroupNewName] = useState("");
  const [copyGroupSourceFields, setCopyGroupSourceFields] = useState<CategoryFieldFormItem[]>([]);
  const [copyGroupError, setCopyGroupError] = useState("");
  const [pendingRemoveFieldIds, setPendingRemoveFieldIds] = useState<string[] | null>(null);
  const [pendingRemoveLabel, setPendingRemoveLabel] = useState("");

  const sortedCategories = useMemo(() => {
    return [...categories].sort((first, second) =>
      normalizeSearchValue(first.name).localeCompare(normalizeSearchValue(second.name), "pt-BR", {
        sensitivity: "base"
      })
    );
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);

    if (!normalizedSearchTerm) {
      return sortedCategories;
    }

    return sortedCategories.filter((category) =>
      normalizeSearchValue(category.name).includes(normalizedSearchTerm)
    );
  }, [searchTerm, sortedCategories]);

  const measurementsById = useMemo(
    () => new Map(measurements.map((measurement) => [measurement.id, measurement])),
    [measurements]
  );

  const shouldUseGroupedFieldLayout = useMemo(
    () => hasMeasurementFieldGrouping(fieldRows),
    [fieldRows]
  );

  const groupedFieldRows = useMemo(
    () =>
      groupMeasurementFieldsByLayout(
        fieldRows.map((field, index) => ({
          ...field,
          slug: field.clientId,
          order: index
        }))
      ),
    [fieldRows]
  );

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || isSubmitting) {
        return;
      }

      if (isCopyGroupModalOpen) {
        closeCopyGroupModal();
        return;
      }

      if (isFieldModalOpen) {
        closeFieldModal();
        return;
      }

      if (!isSubmitting) {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCopyGroupModalOpen, isFieldModalOpen, isModalOpen, isSubmitting]);

  useEffect(() => {
    if (!isDeleteConfirmOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deletingCategoryId) {
        closeDeleteConfirm();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [deletingCategoryId, isDeleteConfirmOpen]);

  async function loadCategories() {
    setIsLoadingCategories(true);
    setLoadError("");

    try {
      const response = await fetchApi("/api/categorias", {
        method: "GET",
        cache: "no-store"
      });

      const payload = (await response.json()) as CategoryApiResponse;

      if (!response.ok) {
        setCategories([]);
        setMeasurements([]);
        setLoadError(payload.error ?? "Nao foi possivel carregar as categorias.");
        setIsLoadingCategories(false);
        return;
      }

      setCategories(payload.items ?? []);
      setMeasurements(payload.measurements ?? []);
      setLoadError("");
      setIsLoadingCategories(false);
    } catch {
      setCategories([]);
      setMeasurements([]);
      setLoadError("Nao foi possivel carregar as categorias.");
      setIsLoadingCategories(false);
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingCategoryId(null);
    setCategoryName("");
    setFieldRows([]);
    setValidationError("");
    setIsSubmitting(false);
    setPendingRemoveFieldIds(null);
    setPendingRemoveLabel("");
    closeFieldModal();
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingCategoryId(null);
    setCategoryName("");
    setFieldRows([]);
    setValidationError("");
    setIsModalOpen(true);
  }

  function openEditModal(category: CategoryItem) {
    setModalMode("edit");
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setFieldRows(category.fields.map(mapFieldToFormItem));
    setValidationError("");
    setIsModalOpen(true);
  }

  function closeFieldModal() {
    setIsFieldModalOpen(false);
    setFieldModalMode("create");
    setEditingFieldClientIds([]);
    setFieldDraftSubgroups([]);
    setFieldDraftGroupName("");
    setFieldModalError("");
  }

  function openDeleteConfirm(category: CategoryItem) {
    setPendingDeleteCategory(category);
    setDeleteConfirmationText("");
    setLoadError("");
    setIsDeleteConfirmOpen(true);
  }

  function closeDeleteConfirm(force = false) {
    if (deletingCategoryId && !force) {
      return;
    }

    setPendingDeleteCategory(null);
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(false);
  }

  function openCreateFieldModal() {
    setFieldModalMode("create");
    setEditingFieldClientIds([]);
    setFieldDraftSubgroups([createFieldDraftSubgroup()]);
    setFieldDraftGroupName("");
    setFieldModalError("");
    setIsFieldModalOpen(true);
  }

  function openCopyGroupModal(group: (typeof groupedFieldRows)[number]) {
    const groupFieldClientIds = new Set(
      group.subgroups.flatMap((sg) => sg.fields.map((f) => f.clientId))
    );
    const groupFields = fieldRows.filter((f) => groupFieldClientIds.has(f.clientId));
    setCopyGroupSourceLabel(group.label ?? "");
    setCopyGroupNewName("");
    setCopyGroupSourceFields(groupFields);
    setCopyGroupError("");
    setIsCopyGroupModalOpen(true);
  }

  function closeCopyGroupModal() {
    setIsCopyGroupModalOpen(false);
    setCopyGroupSourceLabel("");
    setCopyGroupNewName("");
    setCopyGroupSourceFields([]);
    setCopyGroupError("");
  }

  function saveCopyGroup() {
    const trimmedNewName = copyGroupNewName.trim();

    if (!trimmedNewName) {
      setCopyGroupError("Informe um nome para o novo grupo.");
      return;
    }

    if (normalizeSearchValue(trimmedNewName) === normalizeSearchValue(copyGroupSourceLabel)) {
      setCopyGroupError("O novo grupo deve ter um nome diferente do original.");
      return;
    }

    const existingGroupKeys = new Set(fieldRows.map((f) => normalizeSearchValue(f.groupName)));

    if (existingGroupKeys.has(normalizeSearchValue(trimmedNewName))) {
      setCopyGroupError("Já existe um grupo com esse nome.");
      return;
    }

    const copiedFields = copyGroupSourceFields.map((field) => ({
      ...field,
      clientId: createClientId(),
      dbId: undefined,
      groupName: trimmedNewName
    }));

    setFieldRows((current) => [...current, ...copiedFields]);
    setValidationError("");
    closeCopyGroupModal();
  }

  function openEditFieldModal(field: CategoryFieldFormItem) {
    const trimmedGroupName = field.groupName.trim();
    const trimmedSubgroupName = field.subgroupName.trim();
    const selectedFields = trimmedGroupName
      ? fieldRows.filter(
          (row) => normalizeSearchValue(row.groupName) === normalizeSearchValue(trimmedGroupName)
        )
      : trimmedSubgroupName
        ? fieldRows.filter(
            (row) =>
              normalizeSearchValue(row.groupName) === normalizeSearchValue(field.groupName) &&
              normalizeSearchValue(row.subgroupName) === normalizeSearchValue(trimmedSubgroupName)
          )
        : [field];

    setFieldModalMode("edit");
    setEditingFieldClientIds(selectedFields.map((item) => item.clientId));
    setFieldDraftSubgroups(mapFieldsToDraftSubgroups(selectedFields));
    setFieldDraftGroupName(field.groupName);
    setFieldModalError("");
    setIsFieldModalOpen(true);
  }

  function openRemoveGroupConfirm(group: (typeof groupedFieldRows)[number]) {
    const ids = group.subgroups.flatMap((sg) => sg.fields.map((f) => f.clientId));
    setPendingRemoveFieldIds(ids);
    setPendingRemoveLabel(`o grupo "${group.label ?? "sem nome"}"`);
  }

  function openRemoveSubgroupConfirm(
    subgroup: (typeof groupedFieldRows)[number]["subgroups"][number],
    groupLabel: string | null
  ) {
    const ids = subgroup.fields.map((f) => f.clientId);
    const label = [groupLabel, subgroup.label].filter(Boolean).join(" / ") || "sem nome";
    setPendingRemoveFieldIds(ids);
    setPendingRemoveLabel(`o subgrupo "${label}"`);
  }

  function confirmRemoveFields() {
    if (!pendingRemoveFieldIds) return;
    const ids = new Set(pendingRemoveFieldIds);
    setFieldRows((current) => current.filter((f) => !ids.has(f.clientId)));
    setPendingRemoveFieldIds(null);
    setPendingRemoveLabel("");
    setValidationError("");
  }

  function cancelRemoveFields() {
    setPendingRemoveFieldIds(null);
    setPendingRemoveLabel("");
  }

  function removeFieldRow(clientId: string) {
    setFieldRows((current) => current.filter((row) => row.clientId !== clientId));
    setValidationError("");
  }

  function addFieldDraftSubgroup() {
    setFieldDraftSubgroups((current) => [...current, createFieldDraftSubgroup()]);
    setFieldModalError("");
  }

  function updateFieldDraftSubgroup(
    subgroupClientId: string,
    nextValue: Partial<Pick<CategoryFieldDraftSubgroup, "name" | "defaultMeasurementId">>
  ) {
    setFieldDraftSubgroups((current) =>
      current.map((subgroup) => {
        if (subgroup.clientId !== subgroupClientId) return subgroup;

        const updated = { ...subgroup, ...nextValue };

        if (nextValue.defaultMeasurementId !== undefined && nextValue.defaultMeasurementId !== "") {
          updated.rows = subgroup.rows.map((row) => ({
            ...row,
            measurementId: nextValue.defaultMeasurementId as string
          }));
        }

        return updated;
      })
    );
    setFieldModalError("");
  }

  function copyFieldDraftSubgroup(subgroupClientId: string) {
    setFieldDraftSubgroups((current) => {
      const index = current.findIndex((sg) => sg.clientId === subgroupClientId);
      if (index === -1) return current;
      const source = current[index];
      const copy: CategoryFieldDraftSubgroup = {
        clientId: createClientId(),
        name: source.name,
        defaultMeasurementId: source.defaultMeasurementId,
        rows: source.rows.map((row) => ({ ...row, clientId: createClientId(), dbId: undefined }))
      };
      const next = [...current];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setFieldModalError("");
  }

  function removeFieldDraftSubgroup(subgroupClientId: string) {
    setFieldDraftSubgroups((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((subgroup) => subgroup.clientId !== subgroupClientId);
    });
    setFieldModalError("");
  }

  function addFieldDraftRow(subgroupClientId: string) {
    setFieldDraftSubgroups((current) =>
      current.map((subgroup) =>
        subgroup.clientId === subgroupClientId
          ? {
              ...subgroup,
              rows: [
                ...subgroup.rows,
                { ...createFieldDraftRow(), measurementId: subgroup.defaultMeasurementId }
              ]
            }
          : subgroup
      )
    );
    setFieldModalError("");
  }

  function updateFieldDraftRow(
    subgroupClientId: string,
    clientId: string,
    nextValue: Partial<Pick<CategoryFieldDraftRow, "name" | "measurementId" | "hint">>
  ) {
    setFieldDraftSubgroups((current) =>
      current.map((subgroup) =>
        subgroup.clientId === subgroupClientId
          ? {
              ...subgroup,
              rows: subgroup.rows.map((row) =>
                row.clientId === clientId
                  ? {
                      ...row,
                      ...nextValue
                    }
                  : row
              )
            }
          : subgroup
      )
    );
    setFieldModalError("");
  }

  function removeFieldDraftRow(subgroupClientId: string, clientId: string) {
    setFieldDraftSubgroups((current) =>
      current.map((subgroup) => {
        if (subgroup.clientId !== subgroupClientId || subgroup.rows.length <= 1) {
          return subgroup;
        }

        return {
          ...subgroup,
          rows: subgroup.rows.filter((row) => row.clientId !== clientId)
        };
      })
    );
    setFieldModalError("");
  }

  function saveFieldFromModal() {
    const trimmedGroupName = fieldDraftGroupName.trim();
    const sanitizedDraftRows: Array<CategoryFieldDraftRow & { subgroupName: string }> = [];
    const seenDraftSlugs = new Set<string>();
    const seenSubgroupKeys = new Set<string>();

    if (fieldDraftSubgroups.length === 0) {
      setFieldModalError("Adicione pelo menos um subgrupo neste bloco.");
      return;
    }

    for (const [subgroupIndex, subgroup] of fieldDraftSubgroups.entries()) {
      const trimmedSubgroupName = subgroup.name.trim();
      const subgroupKey = normalizeSearchValue(trimmedSubgroupName) || "__blank__";
      const subgroupLabel =
        trimmedSubgroupName || `subgrupo ${String(subgroupIndex + 1).padStart(2, "0")}`;

      if (seenSubgroupKeys.has(subgroupKey)) {
        setFieldModalError(`O ${subgroupLabel} esta duplicado neste bloco.`);
        return;
      }

      seenSubgroupKeys.add(subgroupKey);

      if (subgroup.rows.length === 0) {
        setFieldModalError(`Adicione pelo menos um campo no ${subgroupLabel}.`);
        return;
      }

      for (const [rowIndex, draftRow] of subgroup.rows.entries()) {
        const trimmedName = draftRow.name.trim();

        if (!trimmedName) {
          setFieldModalError(
            `Preencha o nome do campo ${rowIndex + 1} no ${subgroupLabel}.`
          );
          return;
        }

        if (!draftRow.measurementId) {
          setFieldModalError(`Selecione a medida do campo ${trimmedName}.`);
          return;
        }

        const draftSlug = serializeMeasurementFieldSlug({
          name: trimmedName,
          groupName: trimmedGroupName,
          subgroupName: trimmedSubgroupName
        });

        if (!draftSlug) {
          setFieldModalError(`O campo ${trimmedName} possui um nome invalido.`);
          return;
        }

        if (seenDraftSlugs.has(draftSlug)) {
          setFieldModalError(`O campo ${trimmedName} esta duplicado neste bloco.`);
          return;
        }

        const hasDuplicateOutsideBlock = fieldRows.some((field) => {
          if (editingFieldClientIds.includes(field.clientId)) {
            return false;
          }

          return (
            serializeMeasurementFieldSlug({
              name: field.name,
              groupName: field.groupName,
              subgroupName: field.subgroupName
            }) === draftSlug
          );
        });

        if (hasDuplicateOutsideBlock) {
          setFieldModalError(`Ja existe um campo chamado ${trimmedName} nesse mesmo contexto.`);
          return;
        }

        seenDraftSlugs.add(draftSlug);
        sanitizedDraftRows.push({
          ...draftRow,
          name: trimmedName,
          measurementId: draftRow.measurementId,
          hint: draftRow.hint.trim(),
          subgroupName: trimmedSubgroupName
        });
      }
    }

    const nextFieldRows = sanitizedDraftRows.map((draftRow) => ({
      clientId: draftRow.clientId,
      dbId: draftRow.dbId,
      name: draftRow.name,
      measurementId: draftRow.measurementId,
      groupName: trimmedGroupName,
      subgroupName: draftRow.subgroupName,
      hint: draftRow.hint
    }));

    if (fieldModalMode === "edit" && editingFieldClientIds.length > 0) {
      setFieldRows((current) => {
        const insertionIndex = current.findIndex((field) =>
          editingFieldClientIds.includes(field.clientId)
        );
        const preservedFields = current.filter(
          (field) => !editingFieldClientIds.includes(field.clientId)
        );
        const safeInsertionIndex =
          insertionIndex >= 0
            ? Math.min(insertionIndex, preservedFields.length)
            : preservedFields.length;

        return [
          ...preservedFields.slice(0, safeInsertionIndex),
          ...nextFieldRows,
          ...preservedFields.slice(safeInsertionIndex)
        ];
      });
    } else {
      setFieldRows((current) => [...current, ...nextFieldRows]);
    }

    setValidationError("");
    closeFieldModal();
  }

  function validateForm() {
    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      return "Nome da categoria obrigatorio.";
    }


    const seenSlugs = new Set<string>();

    for (const [index, field] of fieldRows.entries()) {
      const fieldName = field.name.trim();
      const fieldSlug = serializeMeasurementFieldSlug({
        name: fieldName,
        groupName: field.groupName,
        subgroupName: field.subgroupName
      });

      if (!fieldName) {
        return `Preencha o nome do campo ${index + 1}.`;
      }

      if (!field.measurementId) {
        return `Selecione a medida do campo ${fieldName}.`;
      }

      if (!fieldSlug) {
        return `O campo ${fieldName} possui um nome invalido.`;
      }

      if (seenSlugs.has(fieldSlug)) {
        return `O campo ${fieldName} esta duplicado no mesmo grupo/subgrupo.`;
      }

      seenSlugs.add(fieldSlug);
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextValidationError = validateForm();

    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    try {
      const response = await fetchApi("/api/categorias", {
        method: modalMode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: editingCategoryId,
          name: categoryName.trim(),
          fields: fieldRows.map((field) => ({
            dbId: field.dbId,
            name: field.name.trim(),
            measurementId: field.measurementId,
            groupName: field.groupName.trim(),
            subgroupName: field.subgroupName.trim(),
            hint: field.hint.trim()
          }))
        })
      });

      const payload = (await response.json()) as CategoryApiResponse;

      if (!response.ok || !payload.item) {
        setValidationError(payload.error ?? "Nao foi possivel salvar a categoria.");
        setIsSubmitting(false);
        return;
      }

      await loadCategories();
      setLoadError("");
      closeModal();
    } catch {
      setValidationError("Nao foi possivel salvar a categoria.");
      setIsSubmitting(false);
    }
  }

  async function handleDeleteCategory() {
    const category = pendingDeleteCategory;

    if (!category || deleteConfirmationText.trim() !== "EXCLUIR") {
      return;
    }

    setDeletingCategoryId(category.id);

    try {
      const response = await fetchApi("/api/categorias", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: category.id
        })
      });

      const payload = (await response.json()) as CategoryApiResponse;

      if (!response.ok) {
        setLoadError(payload.error ?? "Nao foi possivel excluir a categoria.");
        setDeletingCategoryId(null);
        return;
      }

      await loadCategories();
      setLoadError("");

      if (editingCategoryId === category.id) {
        closeModal();
      }

      setDeletingCategoryId(null);
      closeDeleteConfirm(true);
    } catch {
      setLoadError("Nao foi possivel excluir a categoria.");
      setDeletingCategoryId(null);
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
              placeholder="Pesquisar categoria pelo nome"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <button type="button" className="primary-toolbar-button" onClick={openCreateModal}>
            <span className="primary-toolbar-button__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            Nova categoria
          </button>
        </div>

        <section className="inventory-table-card category-card">
          <div className="category-card__header">
            <div>
              <h2>Categorias</h2>
              <p>Cadastre o nome da categoria e o template de calibracao usado pelos instrumentos dela.</p>
            </div>
            <span className="category-card__count">{sortedCategories.length} categorias</span>
          </div>

          {loadError ? <p className="settings-status-banner settings-status-banner--error">{loadError}</p> : null}

          <div className="inventory-table-wrap">
            <table className="inventory-table category-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Template de calibracao</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingCategories ? (
                  <tr>
                    <td colSpan={3} className="inventory-table__empty">
                      Carregando categorias...
                    </td>
                  </tr>
                ) : null}

                {!isLoadingCategories && filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="inventory-table__empty">
                      {searchTerm ? "Nenhuma categoria encontrada com a busca atual." : "Nenhuma categoria cadastrada."}
                    </td>
                  </tr>
                ) : null}

                {!isLoadingCategories
                  ? filteredCategories.map((category, index) => (
                      <tr key={category.id}>
                        <td data-label="Categoria">
                          <div className="category-name-cell">
                            <span className="category-index">{String(index + 1).padStart(2, "0")}</span>
                            <strong className="category-name">{category.name}</strong>
                          </div>
                        </td>
                        <td data-label="Template de calibracao">
                          {category.fields.length > 0 ? (
                            <div className="category-table__field-stack">
                              <strong>{category.fields.length} itens</strong>
                              <span>
                                {category.fields
                                  .slice(0, 3)
                                  .map((field) => field.name)
                                  .join(", ")}
                                {category.fields.length > 3 ? "..." : ""}
                              </span>
                            </div>
                          ) : (
                            <span className="inventory-table__muted">Sem template definido</span>
                          )}
                        </td>
                        <td data-label="Acoes" className="category-table__actions">
                          <div className="category-table__action-list">
                            <button
                              type="button"
                              className="table-action category-table__edit"
                              aria-label={`Editar ${category.name}`}
                              onClick={() => openEditModal(category)}
                              disabled={deletingCategoryId === category.id}
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

                            <button
                              type="button"
                              className="table-action category-table__delete"
                              aria-label={`Excluir ${category.name}`}
                              onClick={() => openDeleteConfirm(category)}
                              disabled={deletingCategoryId === category.id}
                            >
                              <svg viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M6.5 7.5h11M9 7.5V6.2c0-.7.5-1.2 1.2-1.2h3.6c.7 0 1.2.5 1.2 1.2v1.3M8.2 10.2l.6 7.1c.1 1 .9 1.7 1.9 1.7h2.6c1 0 1.8-.8 1.9-1.7l.6-7.1"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M10.5 11.2v5.2M13.5 11.2v5.2"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          <div className="inventory-table-footer">
            <p>
              Exibindo {filteredCategories.length} de {sortedCategories.length} categorias
            </p>
          </div>
        </section>
      </section>

      {isModalOpen ? (
        <div className="instrument-modal-backdrop" role="presentation" onClick={() => !isSubmitting && closeModal()}>
          <section
            className="instrument-modal category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="instrument-modal__header">
              <h2 id="category-modal-title">
                {modalMode === "edit" ? "Editar categoria" : "Cadastrar categoria"}
              </h2>

              <button
                type="button"
                className="instrument-modal__close"
                aria-label="Fechar modal"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </header>

            <form className="instrument-modal__body category-modal__body" onSubmit={handleSubmit}>
              <div className="instrument-modal__content">
                <div className="instrument-modal__grid category-modal__grid">
                  <label className="instrument-modal__field instrument-modal__field--full">
                    <span>Nome da categoria</span>
                    <input
                      type="text"
                      placeholder="Ex: Manometro digital"
                      value={categoryName}
                      onChange={(event) => {
                        setCategoryName(event.target.value);
                        if (validationError) {
                          setValidationError("");
                        }
                      }}
                      className={validationError && !categoryName.trim() ? "is-invalid" : undefined}
                      autoFocus
                    />
                  </label>
                </div>

                <section className="instrument-fields-builder">
                  <div className="instrument-fields-builder__header">
                    <div>
                      <h3>Template de calibracao da categoria</h3>
                      <p>Esses itens vao aparecer automaticamente quando um instrumento dessa categoria for criado.</p>
                    </div>
                    <button type="button" className="instrument-fields-builder__add" onClick={openCreateFieldModal}>
                      Novo campo
                    </button>
                  </div>

                  {fieldRows.length === 0 ? (
                    <div className="instrument-fields-builder__empty">
                      Adicione o primeiro item deste template de calibracao.
                    </div>
                  ) : shouldUseGroupedFieldLayout ? (
                    <div className="template-preview">
                      {groupedFieldRows.map((group) => {
                        const firstField = group.subgroups[0]?.fields[0];

                        return (
                          <section key={group.key} className="template-preview__group">
                            <header className="template-preview__group-header">
                              {group.label && <h4>{group.label}</h4>}
                              <span>
                                {group.subgroups.reduce(
                                  (total, subgroup) => total + subgroup.fields.length,
                                  0
                                )}{" "}
                                campos
                              </span>
                            </header>

                            <div className={getSubgroupGridClassName(group.subgroups.length)}>
                              {group.subgroups.map((subgroup) => (
                                <article key={subgroup.key} className="template-preview__subgroup">
                                  <div className="template-preview__subgroup-header">
                                    {subgroup.label ? <strong>{subgroup.label}</strong> : <span />}
                                    <button
                                      type="button"
                                      className="instrument-fields-builder__remove"
                                      onClick={() => openRemoveSubgroupConfirm(subgroup, group.label)}
                                    >
                                      Remover subgrupo
                                    </button>
                                  </div>

                                  <div className={getFieldGridClassName(subgroup.fields.length)}>
                                    {subgroup.fields.map((field) => {
                                      const measurement = measurementsById.get(field.measurementId);

                                      return (
                                        <article
                                          key={field.clientId}
                                          className="template-preview__field template-preview__field--editable"
                                        >
                                          <strong className="template-preview__field-name">
                                            {field.name}
                                          </strong>
                                          <span className="template-preview__field-measurement">
                                            {measurement?.name ?? "Medida nao informada"}
                                          </span>

                                          <div className="template-preview__field-actions">
                                            <button
                                              type="button"
                                              className="instrument-fields-builder__edit"
                                              onClick={() => openEditFieldModal(field)}
                                            >
                                              Editar
                                            </button>
                                            <button
                                              type="button"
                                              className="instrument-fields-builder__remove"
                                              onClick={() => removeFieldRow(field.clientId)}
                                            >
                                              Remover
                                            </button>
                                          </div>
                                        </article>
                                      );
                                    })}
                                  </div>
                                </article>
                              ))}
                            </div>

                            {firstField ? (
                              <div className="template-preview__group-actions">
                                <button
                                  type="button"
                                  className="instrument-fields-builder__edit"
                                  onClick={() => openEditFieldModal(firstField)}
                                >
                                  Editar bloco
                                </button>
                                <button
                                  type="button"
                                  className="instrument-fields-builder__edit"
                                  onClick={() => openCopyGroupModal(group)}
                                >
                                  Copiar grupo
                                </button>
                                <button
                                  type="button"
                                  className="instrument-fields-builder__remove"
                                  onClick={() => openRemoveGroupConfirm(group)}
                                >
                                  Remover grupo
                                </button>
                              </div>
                            ) : null}
                          </section>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="instrument-fields-builder__list">
                      {fieldRows.map((field, index) => {
                        const measurement = measurementsById.get(field.measurementId);

                        return (
                          <div key={field.clientId} className="instrument-fields-builder__row instrument-fields-builder__row--compact">
                            <div className="instrument-fields-builder__row-top">
                              <div className="instrument-fields-builder__row-summary">
                                <strong>Item {String(index + 1).padStart(2, "0")}</strong>
                                <p>{field.name}</p>
                                {field.groupName || field.subgroupName ? (
                                  <span className="instrument-fields-builder__row-context">
                                    {[field.groupName, field.subgroupName].filter(Boolean).join(" / ")}
                                  </span>
                                ) : null}
                                <span>{measurement?.name ?? "Medida nao informada"}</span>
                              </div>

                              <div className="instrument-fields-builder__row-actions">
                                <button type="button" className="instrument-fields-builder__edit" onClick={() => openEditFieldModal(field)}>
                                  Editar
                                </button>
                                <button type="button" className="instrument-fields-builder__remove" onClick={() => removeFieldRow(field.clientId)}>
                                  Remover
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {validationError ? (
                  <p className="instrument-modal__field-error">{validationError}</p>
                ) : null}

                <footer className="instrument-modal__footer">
                  <button type="button" className="instrument-modal__cancel" onClick={closeModal} disabled={isSubmitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="instrument-modal__submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : modalMode === "edit" ? "Salvar alteracao" : "Salvar categoria"}
                  </button>
                </footer>
              </div>
            </form>

          </section>
        </div>
      ) : null}

      {isFieldModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="field-editor-modal-backdrop"
              role="presentation"
              onClick={closeFieldModal}
            >
              <section
                className="instrument-delete-confirm field-editor-modal"
                role="dialog"
                aria-modal="true"
                aria-label={fieldModalMode === "edit" ? "Editar bloco de campos" : "Novo bloco de campos"}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="field-editor-modal__form">
                  <div className="field-editor-modal__grid field-editor-modal__grid--single">
                    <label className="instrument-modal__field">
                      <span>Grupo principal</span>
                      <input
                        type="text"
                        value={fieldDraftGroupName}
                        onChange={(event) => {
                          setFieldDraftGroupName(event.target.value);
                          if (fieldModalError) {
                            setFieldModalError("");
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="field-editor-modal__section">
                    <div className="field-editor-modal__section-head">
                      <strong>Subgrupos deste bloco</strong>
                      <button
                        type="button"
                        className="field-editor-modal__add-row"
                        onClick={addFieldDraftSubgroup}
                      >
                        Adicionar subgrupo
                      </button>
                    </div>
                  </div>

                  <div className="field-editor-modal__subgroups">
                    {fieldDraftSubgroups.map((subgroup, subgroupIndex) => (
                      <section key={subgroup.clientId} className="field-editor-modal__subgroup">
                        <div className="field-editor-modal__subgroup-head">
                          <label className="instrument-modal__field">
                            <span>Subgrupo {String(subgroupIndex + 1).padStart(2, "0")}</span>
                            <input
                              type="text"
                              value={subgroup.name}
                              placeholder="Opcional"
                              onChange={(event) =>
                                updateFieldDraftSubgroup(subgroup.clientId, {
                                  name: event.target.value
                                })
                              }
                            />
                          </label>

                          <label className="instrument-modal__field">
                            <span>Unidade padrão (opcional)</span>
                            <select
                              value={subgroup.defaultMeasurementId}
                              onChange={(event) =>
                                updateFieldDraftSubgroup(subgroup.clientId, {
                                  defaultMeasurementId: event.target.value
                                })
                              }
                            >
                              <option value="">Nenhuma</option>
                              {measurements.map((measurement) => (
                                <option key={measurement.id} value={measurement.id}>
                                  {measurement.name}
                                </option>
                              ))}
                            </select>
                          </label>

                        </div>

                        <div className="field-editor-modal__section">
                          <div className="field-editor-modal__section-head">
                            <strong>Campos deste subgrupo</strong>
                            <div className="field-editor-modal__section-actions">
                              <button
                                type="button"
                                className="field-editor-modal__add-row"
                                onClick={() => addFieldDraftRow(subgroup.clientId)}
                              >
                                Adicionar campo
                              </button>
                              <button
                                type="button"
                                className="field-editor-modal__add-row"
                                onClick={() => copyFieldDraftSubgroup(subgroup.clientId)}
                              >
                                Copiar subgrupo
                              </button>
                              <button
                                type="button"
                                className="field-editor-modal__remove-subgroup"
                                onClick={() => removeFieldDraftSubgroup(subgroup.clientId)}
                                disabled={fieldDraftSubgroups.length <= 1}
                              >
                                Remover subgrupo
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="field-editor-modal__rows">
                          {subgroup.rows.map((draftRow, rowIndex) => (
                            <div key={draftRow.clientId} className="field-editor-modal__row">
                              <span className="field-editor-modal__row-index">
                                Campo {String(rowIndex + 1).padStart(2, "0")}
                              </span>

                              <div className="field-editor-modal__row-grid">
                                <label className="instrument-modal__field">
                                  <span>Campo</span>
                                  <input
                                    type="text"
                                    value={draftRow.name}
                                    onChange={(event) =>
                                      updateFieldDraftRow(subgroup.clientId, draftRow.clientId, {
                                        name: event.target.value
                                      })
                                    }
                                    autoFocus={subgroupIndex === 0 && rowIndex === 0}
                                  />
                                </label>

                                <label className="instrument-modal__field">
                                  <span>Tipo de medida</span>
                                  <select
                                    value={draftRow.measurementId}
                                    onChange={(event) =>
                                      updateFieldDraftRow(subgroup.clientId, draftRow.clientId, {
                                        measurementId: event.target.value
                                      })
                                    }
                                  >
                                    <option value="" disabled>Selecione a medida</option>
                                    {measurements.map((measurement) => (
                                      <option key={measurement.id} value={measurement.id}>
                                        {measurement.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="instrument-modal__field instrument-modal__field--full">
                                  <span>Dica de extração (opcional)</span>
                                  <input
                                    type="text"
                                    value={draftRow.hint}
                                    placeholder='Ex: "Cap.:" ou "Capacidade máxima" no cabeçalho'
                                    onChange={(event) =>
                                      updateFieldDraftRow(subgroup.clientId, draftRow.clientId, {
                                        hint: event.target.value
                                      })
                                    }
                                  />
                                </label>
                              </div>

                              <div className="field-editor-modal__row-actions">
                                <button
                                  type="button"
                                  className="field-editor-modal__remove-row"
                                  onClick={() =>
                                    removeFieldDraftRow(subgroup.clientId, draftRow.clientId)
                                  }
                                  disabled={subgroup.rows.length <= 1}
                                >
                                  Remover campo
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>

                {fieldModalError ? (
                  <p className="instrument-modal__field-error">{fieldModalError}</p>
                ) : null}

                <div className="instrument-delete-confirm__actions">
                  <button type="button" onClick={closeFieldModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="is-danger field-editor-modal__save"
                    onClick={saveFieldFromModal}
                  >
                    {fieldModalMode === "edit" ? "Salvar bloco" : "Adicionar bloco"}
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}

      {isCopyGroupModalOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="field-editor-modal-backdrop"
              role="presentation"
              onClick={closeCopyGroupModal}
            >
              <section
                className="instrument-delete-confirm field-editor-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="copy-group-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 id="copy-group-modal-title">
                  Copiar grupo{copyGroupSourceLabel ? `: ${copyGroupSourceLabel}` : ""}
                </h3>

                <div className="field-editor-modal__form">
                  <div className="field-editor-modal__grid field-editor-modal__grid--single">
                    <label className="instrument-modal__field">
                      <span>Nome do novo grupo</span>
                      <input
                        type="text"
                        value={copyGroupNewName}
                        placeholder="Nome diferente do original"
                        autoFocus
                        onChange={(event) => {
                          setCopyGroupNewName(event.target.value);
                          if (copyGroupError) setCopyGroupError("");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveCopyGroup();
                        }}
                      />
                    </label>
                  </div>
                </div>

                {copyGroupError ? (
                  <p className="instrument-modal__field-error">{copyGroupError}</p>
                ) : null}

                <div className="instrument-delete-confirm__actions">
                  <button type="button" onClick={closeCopyGroupModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="is-danger field-editor-modal__save"
                    onClick={saveCopyGroup}
                  >
                    Copiar grupo
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}

      {pendingRemoveFieldIds && typeof document !== "undefined"
        ? createPortal(
            <div
              className="field-editor-modal-backdrop"
              role="presentation"
              onClick={cancelRemoveFields}
            >
              <section
                className="instrument-delete-confirm"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <h3>Confirmar remoção</h3>
                <p>
                  Tem certeza que deseja remover {pendingRemoveLabel}? Todos os campos dentro dele
                  serão removidos.
                </p>
                <div className="instrument-delete-confirm__actions">
                  <button type="button" onClick={cancelRemoveFields}>
                    Cancelar
                  </button>
                  <button type="button" className="is-danger" onClick={confirmRemoveFields}>
                    Remover
                  </button>
                </div>
              </section>
            </div>,
            document.body
          )
        : null}

      {isDeleteConfirmOpen && pendingDeleteCategory ? (
        <div
          className="instrument-delete-confirm-backdrop"
          role="presentation"
          onClick={() => closeDeleteConfirm()}
        >
          <section
            className="instrument-delete-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-delete-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="category-delete-confirm-title">Confirmar exclusao da categoria</h3>
            <p>
              Esta acao vai excluir a categoria <strong>{pendingDeleteCategory.name}</strong>.
            </p>
            <p>
              Se ainda existirem instrumentos vinculados, a exclusao sera bloqueada.
            </p>
            <p>
              Para continuar, digite <strong>EXCLUIR</strong> no campo abaixo.
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(event) => setDeleteConfirmationText(event.target.value)}
              placeholder="Digite EXCLUIR"
              disabled={Boolean(deletingCategoryId)}
            />

            <div className="instrument-delete-confirm__actions">
              <button
                type="button"
                onClick={() => closeDeleteConfirm()}
                disabled={Boolean(deletingCategoryId)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={handleDeleteCategory}
                disabled={
                  deleteConfirmationText.trim() !== "EXCLUIR" || Boolean(deletingCategoryId)
                }
              >
                {deletingCategoryId ? "Excluindo..." : "Excluir categoria"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
