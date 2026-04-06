"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { CategoryItem } from "@/lib/categories";

type CategoryModalMode = "create" | "edit";

type CategoryApiResponse = {
  error?: string;
  item?: CategoryItem;
  items?: CategoryItem[];
  success?: boolean;
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function CategoriesContent() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<CategoryModalMode>("create");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

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
      if (event.key === "Escape" && !isSubmitting) {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen, isSubmitting]);

  async function loadCategories() {
    setIsLoadingCategories(true);
    setLoadError("");

    try {
      const response = await fetch("/api/categorias", {
        method: "GET",
        cache: "no-store"
      });

      const payload = (await response.json()) as CategoryApiResponse;

      if (!response.ok) {
        setCategories([]);
        setLoadError(payload.error ?? "Nao foi possivel carregar as categorias.");
        setIsLoadingCategories(false);
        return;
      }

      setCategories(payload.items ?? []);
      setLoadError("");
      setIsLoadingCategories(false);
    } catch {
      setCategories([]);
      setLoadError("Nao foi possivel carregar as categorias.");
      setIsLoadingCategories(false);
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingCategoryId(null);
    setCategoryName("");
    setValidationError("");
    setIsSubmitting(false);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingCategoryId(null);
    setCategoryName("");
    setValidationError("");
    setIsModalOpen(true);
  }

  function openEditModal(category: CategoryItem) {
    setModalMode("edit");
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setValidationError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      setValidationError("Nome da categoria obrigatorio.");
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    try {
      const response = await fetch("/api/categorias", {
        method: modalMode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: editingCategoryId,
          name: trimmedName
        })
      });

      const payload = (await response.json()) as CategoryApiResponse;

      if (!response.ok || !payload.item) {
        setValidationError(payload.error ?? "Nao foi possivel salvar a categoria.");
        setIsSubmitting(false);
        return;
      }

      if (modalMode === "edit" && editingCategoryId) {
        setCategories((current) =>
          current.map((category) =>
            category.id === editingCategoryId ? payload.item ?? category : category
          )
        );
      } else {
        setCategories((current) => [...current, payload.item as CategoryItem]);
      }

      setLoadError("");
      closeModal();
    } catch {
      setValidationError("Nao foi possivel salvar a categoria.");
      setIsSubmitting(false);
    }
  }

  async function handleDeleteCategory(category: CategoryItem) {
    const confirmed = window.confirm(`Excluir a categoria "${category.name}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingCategoryId(category.id);

    try {
      const response = await fetch("/api/categorias", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: category.id })
      });

      const payload = (await response.json()) as CategoryApiResponse;

      if (!response.ok) {
        setLoadError(payload.error ?? "Nao foi possivel excluir a categoria.");
        setDeletingCategoryId(null);
        return;
      }

      setCategories((current) => current.filter((item) => item.id !== category.id));
      setLoadError("");

      if (editingCategoryId === category.id) {
        closeModal();
      }

      setDeletingCategoryId(null);
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
            Adicionar categoria
          </button>
        </div>

        <section className="inventory-table-card category-card">
          <div className="category-card__header">
            <div>
              <h2>Categorias cadastradas</h2>
              <p>Cadastre e edite os nomes usados nos instrumentos.</p>
            </div>
            <span className="category-card__count">{sortedCategories.length} categorias</span>
          </div>

          {loadError ? <p className="settings-status-banner settings-status-banner--error">{loadError}</p> : null}

          <div className="inventory-table-wrap">
            <table className="inventory-table category-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingCategories ? (
                  <tr>
                    <td colSpan={2} className="inventory-table__empty">
                      Carregando categorias...
                    </td>
                  </tr>
                ) : null}

                {!isLoadingCategories && filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="inventory-table__empty">
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
                              onClick={() => handleDeleteCategory(category)}
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
                {modalMode === "edit" ? "Editar categoria" : "Adicionar categoria"}
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
                      className={validationError ? "is-invalid" : undefined}
                      autoFocus
                    />
                    {validationError ? (
                      <small className="instrument-modal__field-error">{validationError}</small>
                    ) : null}
                  </label>
                </div>

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
    </>
  );
}
