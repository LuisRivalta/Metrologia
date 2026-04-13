"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api/client";
import type { CategoryItem } from "@/lib/categories";
import type { MeasurementItem } from "@/lib/measurements";

type CategoryModalMode = "create" | "edit";
type CategoryFieldModalMode = "create" | "edit";

type CategoryFieldFormItem = {
  clientId: string;
  dbId?: number;
  name: string;
  measurementId: string;
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
    measurementId: field.measurementId
  };
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
  const [editingFieldClientId, setEditingFieldClientId] = useState<string | null>(null);
  const [fieldDraftName, setFieldDraftName] = useState("");
  const [fieldDraftMeasurementId, setFieldDraftMeasurementId] = useState("");
  const [fieldModalError, setFieldModalError] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<CategoryItem | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

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

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || isSubmitting) {
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
  }, [isFieldModalOpen, isModalOpen, isSubmitting]);

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
    setEditingFieldClientId(null);
    setFieldDraftName("");
    setFieldDraftMeasurementId("");
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
    setEditingFieldClientId(null);
    setFieldDraftName("");
    setFieldDraftMeasurementId("");
    setFieldModalError("");
    setIsFieldModalOpen(true);
  }

  function openEditFieldModal(field: CategoryFieldFormItem) {
    setFieldModalMode("edit");
    setEditingFieldClientId(field.clientId);
    setFieldDraftName(field.name);
    setFieldDraftMeasurementId(field.measurementId);
    setFieldModalError("");
    setIsFieldModalOpen(true);
  }

  function removeFieldRow(clientId: string) {
    setFieldRows((current) => current.filter((row) => row.clientId !== clientId));
    setValidationError("");
  }

  function saveFieldFromModal() {
    const trimmedName = fieldDraftName.trim();

    if (!trimmedName) {
      setFieldModalError("Nome do campo obrigatorio.");
      return;
    }

    if (!fieldDraftMeasurementId) {
      setFieldModalError("Selecione a medida do campo.");
      return;
    }

    const normalizedDraftName = normalizeSearchValue(trimmedName);
    const hasDuplicate = fieldRows.some((field) => {
      if (field.clientId === editingFieldClientId) {
        return false;
      }

      return normalizeSearchValue(field.name) === normalizedDraftName;
    });

    if (hasDuplicate) {
      setFieldModalError("Ja existe um campo com esse nome.");
      return;
    }

    if (fieldModalMode === "edit" && editingFieldClientId) {
      setFieldRows((current) =>
        current.map((field) =>
          field.clientId === editingFieldClientId
            ? {
                ...field,
                dbId: field.dbId,
                name: trimmedName,
                measurementId: fieldDraftMeasurementId
              }
            : field
        )
      );
    } else {
      setFieldRows((current) => [
        ...current,
        {
          clientId: createClientId(),
          name: trimmedName,
          measurementId: fieldDraftMeasurementId
        }
      ]);
    }

    setValidationError("");
    closeFieldModal();
  }

  function validateForm() {
    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      return "Nome da categoria obrigatorio.";
    }

    if (fieldRows.length === 0) {
      return "Adicione pelo menos um item ao template de calibracao da categoria.";
    }

    const seenNames = new Set<string>();

    for (const [index, field] of fieldRows.entries()) {
      const fieldName = field.name.trim();
      const normalizedFieldName = normalizeSearchValue(fieldName);

      if (!fieldName) {
        return `Preencha o nome do campo ${index + 1}.`;
      }

      if (!field.measurementId) {
        return `Selecione a medida do campo ${fieldName}.`;
      }

      if (seenNames.has(normalizedFieldName)) {
        return `O campo ${fieldName} esta duplicado.`;
      }

      seenNames.add(normalizedFieldName);
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
            measurementId: field.measurementId
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
                  ) : (
                    <div className="instrument-fields-builder__list">
                      {fieldRows.map((field, index) => {
                        const measurement = measurements.find(
                          (item) => item.id === field.measurementId
                        );

                        return (
                          <div key={field.clientId} className="instrument-fields-builder__row instrument-fields-builder__row--compact">
                            <div className="instrument-fields-builder__row-top">
                              <div className="instrument-fields-builder__row-summary">
                                <strong>Item {String(index + 1).padStart(2, "0")}</strong>
                                <p>{field.name}</p>
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

            {isFieldModalOpen ? (
              <div
                className="instrument-delete-confirm-backdrop field-editor-modal-backdrop"
                role="presentation"
                onClick={closeFieldModal}
              >
                <section
                  className="instrument-delete-confirm field-editor-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="field-editor-modal-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <h3 id="field-editor-modal-title">
                    {fieldModalMode === "edit" ? "Editar campo" : "Novo campo"}
                  </h3>
                  <p>Defina o nome do item e a medida que essa categoria deve usar no template de calibracao.</p>

                  <div className="field-editor-modal__form">
                    <label className="instrument-modal__field">
                      <span>Nome do campo</span>
                      <input
                        type="text"
                        placeholder="Ex: Diametro interno"
                        value={fieldDraftName}
                        onChange={(event) => {
                          setFieldDraftName(event.target.value);
                          if (fieldModalError) {
                            setFieldModalError("");
                          }
                        }}
                        autoFocus
                      />
                    </label>

                    <label className="instrument-modal__field">
                      <span>Tipo de medida</span>
                      <select
                        value={fieldDraftMeasurementId}
                        onChange={(event) => {
                          setFieldDraftMeasurementId(event.target.value);
                          if (fieldModalError) {
                            setFieldModalError("");
                          }
                        }}
                      >
                        <option value="" disabled>Selecione a medida</option>
                        {measurements.map((measurement) => (
                          <option key={measurement.id} value={measurement.id}>
                            {measurement.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {fieldModalError ? (
                    <p className="instrument-modal__field-error">{fieldModalError}</p>
                  ) : null}

                  <div className="instrument-delete-confirm__actions">
                    <button type="button" onClick={closeFieldModal}>
                      Cancelar
                    </button>
                    <button type="button" className="is-danger field-editor-modal__save" onClick={saveFieldFromModal}>
                      {fieldModalMode === "edit" ? "Salvar campo" : "Adicionar campo"}
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

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
