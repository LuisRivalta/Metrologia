"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
};

type CategoryModalMode = "create" | "edit";

const initialCategories: Category[] = [
  { id: "cat-1", name: "Manometro Digital" },
  { id: "cat-2", name: "Paquimetro Digital" },
  { id: "cat-3", name: "Termometro Infravermelho" },
  { id: "cat-4", name: "Micrometro Externo" }
];

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function createCategoryId() {
  return `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CategoriesContent() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<CategoryModalMode>("create");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [validationError, setValidationError] = useState("");

  const filteredCategories = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    const sortedCategories = [...categories].sort((first, second) =>
      normalizeSearchValue(first.name).localeCompare(normalizeSearchValue(second.name), "pt-BR", {
        sensitivity: "base"
      })
    );

    if (!normalizedSearchTerm) {
      return sortedCategories;
    }

    return sortedCategories.filter((category) =>
      normalizeSearchValue(category.name).includes(normalizedSearchTerm)
    );
  }, [categories, searchTerm]);

  useEffect(() => {
    if (!isModalOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setEditingCategoryId(null);
        setCategoryName("");
        setValidationError("");
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen]);

  function openCreateModal() {
    setModalMode("create");
    setEditingCategoryId(null);
    setCategoryName("");
    setValidationError("");
    setIsModalOpen(true);
  }

  function openEditModal(category: Category) {
    setModalMode("edit");
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setValidationError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingCategoryId(null);
    setCategoryName("");
    setValidationError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      setValidationError("Nome da categoria obrigatorio.");
      return;
    }

    const normalizedName = normalizeSearchValue(trimmedName);
    const hasDuplicateName = categories.some(
      (category) =>
        category.id !== editingCategoryId && normalizeSearchValue(category.name) === normalizedName
    );

    if (hasDuplicateName) {
      setValidationError("Ja existe uma categoria com esse nome.");
      return;
    }

    if (modalMode === "edit" && editingCategoryId) {
      setCategories((current) =>
        current.map((category) =>
          category.id === editingCategoryId ? { ...category, name: trimmedName } : category
        )
      );
      closeModal();
      return;
    }

    setCategories((current) => [...current, { id: createCategoryId(), name: trimmedName }]);
    closeModal();
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
            <span className="category-card__count">{categories.length} categorias</span>
          </div>

          <div className="inventory-table-wrap">
            <table className="inventory-table category-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="inventory-table__empty">
                      Nenhuma categoria encontrada com a busca atual.
                    </td>
                  </tr>
                ) : null}

                {filteredCategories.map((category, index) => (
                  <tr key={category.id}>
                    <td data-label="Categoria">
                      <div className="category-name-cell">
                        <span className="category-index">{String(index + 1).padStart(2, "0")}</span>
                        <strong className="category-name">{category.name}</strong>
                      </div>
                    </td>
                    <td data-label="Acoes" className="category-table__actions">
                      <button
                        type="button"
                        className="table-action category-table__edit"
                        aria-label={`Editar ${category.name}`}
                        onClick={() => openEditModal(category)}
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
                ))}
              </tbody>
            </table>
          </div>

          <div className="inventory-table-footer">
            <p>
              Exibindo {filteredCategories.length} de {categories.length} categorias
            </p>
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
                        setValidationError("");
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
                  <button type="button" className="instrument-modal__cancel" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="instrument-modal__submit">
                    {modalMode === "edit" ? "Salvar alteracoes" : "Salvar categoria"}
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
