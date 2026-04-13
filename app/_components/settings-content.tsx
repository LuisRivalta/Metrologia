"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api/client";
import type { MeasurementItem } from "@/lib/measurements";
import { PageTransitionLink } from "./page-transition-link";

type MeasurementModalMode = "create" | "edit";

type MeasurementApiResponse = {
  error?: string;
  item?: MeasurementItem;
  items?: MeasurementItem[];
  success?: boolean;
};

export function SettingsContent() {
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<MeasurementModalMode>("create");
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);
  const [measureName, setMeasureName] = useState("");
  const [measureDescription, setMeasureDescription] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingMeasurementId, setDeletingMeasurementId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [pendingDeleteMeasurement, setPendingDeleteMeasurement] = useState<MeasurementItem | null>(null);

  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((first, second) =>
      first.name.localeCompare(second.name, "pt-BR", { sensitivity: "base" })
    );
  }, [measurements]);

  useEffect(() => {
    void loadMeasurements();
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

  useEffect(() => {
    if (!isDeleteConfirmOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deletingMeasurementId) {
        closeDeleteConfirm();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDeleteConfirmOpen, deletingMeasurementId]);

  async function loadMeasurements() {
    setIsLoadingMeasurements(true);
    setLoadError("");

    try {
      const response = await fetchApi("/api/medidas", {
        method: "GET",
        cache: "no-store"
      });

      const payload = (await response.json()) as MeasurementApiResponse;

      if (!response.ok) {
        setMeasurements([]);
        setLoadError(payload.error ?? "Nao foi possivel carregar as medidas.");
        setIsLoadingMeasurements(false);
        return;
      }

      setMeasurements(payload.items ?? []);
      setLoadError("");
      setIsLoadingMeasurements(false);
    } catch {
      setMeasurements([]);
      setLoadError("Nao foi possivel carregar as medidas.");
      setIsLoadingMeasurements(false);
    }
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingMeasurementId(null);
    setMeasureName("");
    setMeasureDescription("");
    setValidationError("");
    setIsSubmitting(false);
  }

  function openDeleteConfirm(measurement: MeasurementItem) {
    setPendingDeleteMeasurement(measurement);
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    setPendingDeleteMeasurement(null);
    setDeleteConfirmationText("");
    setIsDeleteConfirmOpen(false);
  }

  function openCreateModal() {
    setModalMode("create");
    setEditingMeasurementId(null);
    setMeasureName("");
    setMeasureDescription("");
    setValidationError("");
    setIsModalOpen(true);
  }

  function openEditModal(measurement: MeasurementItem) {
    setModalMode("edit");
    setEditingMeasurementId(measurement.id);
    setMeasureName(measurement.name);
    setMeasureDescription(measurement.description);
    setValidationError("");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = measureName.trim();

    if (!trimmedName) {
      setValidationError("Nome da medida obrigatorio.");
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    try {
      const response = await fetchApi("/api/medidas", {
        method: modalMode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: editingMeasurementId,
          name: trimmedName,
          description: measureDescription.trim()
        })
      });

      const payload = (await response.json()) as MeasurementApiResponse;

      if (!response.ok || !payload.item) {
        setValidationError(payload.error ?? "Nao foi possivel salvar a medida.");
        setIsSubmitting(false);
        return;
      }

      await loadMeasurements();
      setLoadError("");
      closeModal();
    } catch {
      setValidationError("Nao foi possivel salvar a medida.");
      setIsSubmitting(false);
    }
  }

  async function handleDeleteMeasurement() {
    const measurementId = pendingDeleteMeasurement?.id;

    if (!measurementId || deleteConfirmationText.trim() !== "CONFIRMAR") {
      return;
    }

    setDeletingMeasurementId(measurementId);

    try {
      const response = await fetchApi("/api/medidas", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: measurementId })
      });

      const payload = (await response.json()) as MeasurementApiResponse;

      if (!response.ok) {
        setLoadError(payload.error ?? "Nao foi possivel excluir a medida.");
        setDeletingMeasurementId(null);
        return;
      }

      setMeasurements((current) => current.filter((measurement) => measurement.id !== measurementId));
      setLoadError("");

      if (editingMeasurementId === measurementId) {
        closeModal();
      }

      closeDeleteConfirm();
      setDeletingMeasurementId(null);
    } catch {
      setLoadError("Nao foi possivel excluir a medida.");
      setDeletingMeasurementId(null);
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
            Cadastrar medida
          </button>
        </div>

        <section className="inventory-table-card settings-card settings-card--table">
          <div className="settings-card__header settings-card__header--split">
            <div>
              <h2>Medidas cadastradas</h2>
              <p>A interface mostra simbolos amigaveis, mesmo com o banco usando um formato tecnico.</p>
            </div>
            <span className="category-card__count">{sortedMeasurements.length} medidas</span>
          </div>

          {loadError ? <p className="settings-status-banner settings-status-banner--error">{loadError}</p> : null}

          <div className="inventory-table-wrap settings-measure-table-wrap">
            <table className="inventory-table settings-measure-table">
              <thead>
                <tr>
                  <th>Medida</th>
                  <th>Descricao</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingMeasurements ? (
                  <tr>
                    <td colSpan={3} className="inventory-table__empty">
                      Carregando medidas...
                    </td>
                  </tr>
                ) : null}

                {!isLoadingMeasurements && sortedMeasurements.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="inventory-table__empty">
                      Nenhuma medida cadastrada.
                    </td>
                  </tr>
                ) : null}

                {!isLoadingMeasurements
                  ? sortedMeasurements.map((measurement, index) => (
                      <tr key={measurement.id}>
                        <td data-label="Medida">
                          <div className="settings-measure-table__name-cell">
                            <span className="settings-measure-list__index">{String(index + 1).padStart(2, "0")}</span>
                            <strong className="settings-measure-list__name">{measurement.name}</strong>
                          </div>
                        </td>
                        <td data-label="Descricao">
                          <p className="settings-measure-table__description">
                            {measurement.description || "Sem descricao informada."}
                          </p>
                        </td>
                        <td data-label="Acoes" className="settings-measure-table__actions">
                          <div className="settings-measure-list__actions">
                            <button
                              type="button"
                              className="settings-measure-list__action settings-measure-list__action--edit"
                              aria-label={`Editar medida ${measurement.name}`}
                              onClick={() => openEditModal(measurement)}
                              disabled={deletingMeasurementId === measurement.id}
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
                              className="settings-measure-list__action settings-measure-list__action--delete"
                              aria-label={`Excluir medida ${measurement.name}`}
                              onClick={() => openDeleteConfirm(measurement)}
                              disabled={deletingMeasurementId === measurement.id}
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
            <p>Exibindo {sortedMeasurements.length} medidas</p>
          </div>
        </section>
      </section>

      {isModalOpen ? (
        <div className="instrument-modal-backdrop" role="presentation" onClick={closeModal}>
          <section
            className="instrument-modal category-modal settings-measure-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-measure-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="instrument-modal__header">
              <h2 id="settings-measure-modal-title">
                {modalMode === "edit" ? "Editar medida" : "Cadastrar medida"}
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

            <form className="instrument-modal__body" onSubmit={handleSubmit}>
              <div className="instrument-modal__content">
                <div className="instrument-modal__grid category-modal__grid">
                  <label className="instrument-modal__field instrument-modal__field--full">
                    <span>Nome da medida</span>
                    <input
                      type="text"
                      value={measureName}
                      onChange={(event) => {
                        setMeasureName(event.target.value);
                        if (validationError) {
                          setValidationError("");
                        }
                      }}
                      placeholder="Ex: kgf/cm²"
                      className={validationError ? "is-invalid" : ""}
                    />
                    <small className="instrument-modal__field-help">
                      O sistema converte automaticamente para o formato interno do banco, como{" "}
                      <code>kgf_cm2</code>, <code>grau</code> ou <code>celsius</code>.
                    </small>
                    {validationError ? <small className="instrument-modal__field-error">{validationError}</small> : null}
                  </label>

                  <label className="instrument-modal__field instrument-modal__field--full">
                    <span>Descricao</span>
                    <input
                      type="text"
                      value={measureDescription}
                      onChange={(event) => setMeasureDescription(event.target.value)}
                      placeholder="Ex: quilograma-forca por centimetro quadrado"
                    />
                  </label>
                </div>
              </div>

              <footer className="instrument-modal__footer">
                <button type="button" className="instrument-modal__cancel" onClick={closeModal} disabled={isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" className="instrument-modal__submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : modalMode === "edit" ? "Salvar alteracao" : "Salvar medida"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {isDeleteConfirmOpen && pendingDeleteMeasurement ? (
        <div
          className="instrument-delete-confirm-backdrop"
          role="presentation"
          onClick={deletingMeasurementId ? undefined : closeDeleteConfirm}
        >
          <section
            className="instrument-delete-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-delete-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="settings-delete-confirm-title">Confirmar exclusao</h3>
            <p>
              Para apagar a medida <strong>{pendingDeleteMeasurement.name}</strong>, digite{" "}
              <strong>CONFIRMAR</strong> no campo abaixo.
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(event) => setDeleteConfirmationText(event.target.value)}
              placeholder="Digite CONFIRMAR"
              disabled={Boolean(deletingMeasurementId)}
            />

            <div className="instrument-delete-confirm__actions">
              <button type="button" onClick={closeDeleteConfirm} disabled={Boolean(deletingMeasurementId)}>
                Voltar
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={handleDeleteMeasurement}
                disabled={deleteConfirmationText.trim() !== "CONFIRMAR" || Boolean(deletingMeasurementId)}
              >
                {deletingMeasurementId ? "Excluindo..." : "Excluir Medida"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
