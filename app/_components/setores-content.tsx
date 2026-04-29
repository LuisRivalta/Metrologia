"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api/client";
import { formatSetorLabel, type SetorItem } from "@/lib/setores";
import { PageTransitionLink } from "./page-transition-link";

type SetorModalMode = "create" | "edit";

type SetorApiResponse = {
  error?: string;
  item?: SetorItem;
  items?: SetorItem[];
  success?: boolean;
};

export function SetoresContent() {
  const [setores, setSetores] = useState<SetorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<SetorModalMode>("create");
  const [editingSetorId, setEditingSetorId] = useState<number | null>(null);
  const [codigoValue, setCodigoValue] = useState("");
  const [nomeValue, setNomeValue] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSetorId, setDeletingSetorId] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [pendingDeleteSetor, setPendingDeleteSetor] = useState<SetorItem | null>(null);

  const sortedSetores = useMemo(() => {
    return [...setores].sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR", { sensitivity: "base" }));
  }, [setores]);

  useEffect(() => {
    void loadSetores();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) closeModal();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, isSubmitting]);

  useEffect(() => {
    if (!isDeleteConfirmOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deletingSetorId) closeDeleteConfirm();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDeleteConfirmOpen, deletingSetorId]);

  async function loadSetores() {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await fetchApi("/api/setores", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as SetorApiResponse;

      if (!response.ok) {
        setSetores([]);
        setLoadError(payload.error ?? "Nao foi possivel carregar os setores.");
        setIsLoading(false);
        return;
      }

      setSetores(payload.items ?? []);
      setLoadError("");
      setIsLoading(false);
    } catch {
      setSetores([]);
      setLoadError("Nao foi possivel carregar os setores.");
      setIsLoading(false);
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingSetorId(null);
    setCodigoValue("");
    setNomeValue("");
    setValidationError("");
    setIsSubmitting(false);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingSetorId(null);
    setCodigoValue("");
    setNomeValue("");
    setValidationError("");
    setIsModalOpen(true);
  }

  function openEditModal(setor: SetorItem) {
    setModalMode("edit");
    setEditingSetorId(setor.id);
    setCodigoValue(setor.codigo);
    setNomeValue(setor.nome);
    setValidationError("");
    setIsModalOpen(true);
  }

  function openDeleteConfirm(setor: SetorItem) {
    setPendingDeleteSetor(setor);
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    setPendingDeleteSetor(null);
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCodigo = codigoValue.trim();
    const trimmedNome = nomeValue.trim();

    if (!trimmedCodigo) {
      setValidationError("Codigo do setor obrigatorio.");
      return;
    }

    if (!trimmedNome) {
      setValidationError("Nome do setor obrigatorio.");
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    try {
      const response = await fetchApi("/api/setores", {
        method: modalMode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingSetorId, codigo: trimmedCodigo, nome: trimmedNome })
      });

      const payload = (await response.json()) as SetorApiResponse;

      if (!response.ok || !payload.item) {
        setValidationError(payload.error ?? "Nao foi possivel salvar o setor.");
        setIsSubmitting(false);
        return;
      }

      await loadSetores();
      setLoadError("");
      closeModal();
    } catch {
      setValidationError("Nao foi possivel salvar o setor.");
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSetor() {
    const setorId = pendingDeleteSetor?.id;

    if (!setorId || deleteConfirmationText.trim() !== "CONFIRMAR") return;

    setDeletingSetorId(setorId);

    try {
      const response = await fetchApi("/api/setores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: setorId })
      });

      const payload = (await response.json()) as SetorApiResponse;

      if (!response.ok) {
        setLoadError(payload.error ?? "Nao foi possivel excluir o setor.");
        setDeletingSetorId(null);
        return;
      }

      setSetores((current) => current.filter((s) => s.id !== setorId));
      setLoadError("");
      closeDeleteConfirm();
      setDeletingSetorId(null);
    } catch {
      setLoadError("Nao foi possivel excluir o setor.");
      setDeletingSetorId(null);
    }
  }

  return (
    <>
      <section className="inventory-content">
        <div className="settings-back-link-wrap">
          <PageTransitionLink href="/configuracoes" className="settings-back-link">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 6 9 12l6 6"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Voltar para configuracoes
          </PageTransitionLink>
        </div>

        <div className="inventory-actions settings-measure-actions">
          <button type="button" className="primary-toolbar-button" onClick={openCreateModal}>
            <span className="primary-toolbar-button__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            Cadastrar setor
          </button>
        </div>

        <section className="inventory-table-card settings-card settings-card--table">
          <div className="settings-card__header settings-card__header--split">
            <div>
              <h2>Setores cadastrados</h2>
              <p>Setores de uso fisico dos instrumentos. O codigo segue o formato definido pela empresa (ex: 3.03).</p>
            </div>
            <span className="category-card__count">{sortedSetores.length} setores</span>
          </div>

          {loadError ? <p className="settings-status-banner settings-status-banner--error">{loadError}</p> : null}

          <div className="inventory-table-wrap settings-measure-table-wrap">
            <table className="inventory-table settings-measure-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nome</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="inventory-table__empty">Carregando setores...</td>
                  </tr>
                ) : null}

                {!isLoading && sortedSetores.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="inventory-table__empty">Nenhum setor cadastrado.</td>
                  </tr>
                ) : null}

                {!isLoading
                  ? sortedSetores.map((setor) => (
                      <tr key={setor.id}>
                        <td data-label="Codigo">
                          <strong className="settings-measure-list__name">{setor.codigo}</strong>
                        </td>
                        <td data-label="Nome">
                          <p className="settings-measure-table__description">{setor.nome}</p>
                        </td>
                        <td data-label="Acoes" className="settings-measure-table__actions">
                          <div className="settings-measure-list__actions">
                            <button
                              type="button"
                              className="settings-measure-list__action settings-measure-list__action--edit"
                              aria-label={`Editar setor ${formatSetorLabel(setor)}`}
                              onClick={() => openEditModal(setor)}
                              disabled={deletingSetorId === setor.id}
                            >
                              <svg viewBox="0 0 24 24" fill="none">
                                <path d="M4 16.8V20h3.2L18 9.2 14.8 6 4 16.8Z" fill="currentColor" />
                                <path d="m13.8 7 3.2 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="settings-measure-list__action settings-measure-list__action--delete"
                              aria-label={`Excluir setor ${formatSetorLabel(setor)}`}
                              onClick={() => openDeleteConfirm(setor)}
                              disabled={deletingSetorId === setor.id}
                            >
                              <svg viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M6.5 7.5h11M9 7.5V6.2c0-.7.5-1.2 1.2-1.2h3.6c.7 0 1.2.5 1.2 1.2v1.3M8.2 10.2l.6 7.1c.1 1 .9 1.7 1.9 1.7h2.6c1 0 1.8-.8 1.9-1.7l.6-7.1"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path d="M10.5 11.2v5.2M13.5 11.2v5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
            <p>Exibindo {sortedSetores.length} setores</p>
          </div>
        </section>
      </section>

      {isModalOpen ? (
        <div className="instrument-modal-backdrop" role="presentation">
          <section
            className="instrument-modal category-modal settings-measure-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-setor-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="instrument-modal__header">
              <h2 id="settings-setor-modal-title">
                {modalMode === "edit" ? "Editar setor" : "Cadastrar setor"}
              </h2>
              <button
                type="button"
                className="instrument-modal__close"
                aria-label="Fechar modal"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <form className="instrument-modal__body" onSubmit={handleSubmit}>
              <div className="instrument-modal__content">
                <div className="instrument-modal__grid category-modal__grid">
                  <label className="instrument-modal__field instrument-modal__field--full">
                    <span>Codigo</span>
                    <input
                      type="text"
                      value={codigoValue}
                      onChange={(event) => {
                        setCodigoValue(event.target.value);
                        if (validationError) setValidationError("");
                      }}
                      placeholder="Ex: 3.03"
                    />
                    <small className="instrument-modal__field-help">
                      Identificador unico do setor. Use o formato padrao da empresa, ex: 3.03.
                    </small>
                  </label>

                  <label className="instrument-modal__field instrument-modal__field--full">
                    <span>Nome</span>
                    <input
                      type="text"
                      value={nomeValue}
                      onChange={(event) => {
                        setNomeValue(event.target.value);
                        if (validationError) setValidationError("");
                      }}
                      placeholder="Ex: Laboratorio de Pressao"
                    />
                  </label>

                  {validationError ? (
                    <small className="instrument-modal__field-error">{validationError}</small>
                  ) : null}
                </div>
              </div>

              <footer className="instrument-modal__footer">
                <button type="button" className="instrument-modal__cancel" onClick={closeModal} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="instrument-modal__submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : modalMode === "edit" ? "Salvar alteracao" : "Salvar setor"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {isDeleteConfirmOpen && pendingDeleteSetor ? (
        <div
          className="instrument-delete-confirm-backdrop"
          role="presentation"
          onClick={deletingSetorId ? undefined : closeDeleteConfirm}
        >
          <section
            className="instrument-delete-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-setor-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="settings-setor-delete-title">Confirmar exclusao</h3>
            <p>
              Para apagar o setor <strong>{formatSetorLabel(pendingDeleteSetor)}</strong>, digite{" "}
              <strong>CONFIRMAR</strong> no campo abaixo. Os instrumentos vinculados nao serao excluidos.
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(event) => setDeleteConfirmationText(event.target.value)}
              placeholder="Digite CONFIRMAR"
              disabled={Boolean(deletingSetorId)}
            />
            <div className="instrument-delete-confirm__actions">
              <button type="button" onClick={closeDeleteConfirm} disabled={Boolean(deletingSetorId)}>
                Voltar
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={handleDeleteSetor}
                disabled={deleteConfirmationText.trim() !== "CONFIRMAR" || Boolean(deletingSetorId)}
              >
                {deletingSetorId ? "Excluindo..." : "Excluir Setor"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
