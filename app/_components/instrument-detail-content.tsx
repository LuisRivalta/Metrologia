"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api/client";
import type { InstrumentDetailItem } from "@/lib/instruments";
import {
  groupMeasurementFieldsByLayout,
  hasMeasurementFieldGrouping,
  sortMeasurementFields
} from "@/lib/measurement-fields";
import { PageTransitionLink } from "./page-transition-link";

type InstrumentDetailContentProps = {
  instrumentId: number;
};

type InstrumentApiResponse = {
  error?: string;
  item?: InstrumentDetailItem;
};

function getStatusLabel(tone: InstrumentDetailItem["tone"]) {
  if (tone === "danger") return "Vencido";
  if (tone === "warning") return "Perto de vencer";
  return "No prazo";
}

function getCalibrationAlertCopy(item: InstrumentDetailItem) {
  if (item.tone === "danger") {
    return "Esse instrumento ja esta vencido. Registre a nova calibracao para atualizar o prazo e anexar o certificado mais recente.";
  }

  if (item.tone === "warning") {
    return "Esse instrumento esta perto de vencer. Registrar a nova calibracao agora evita perda de prazo e mantem o historico em dia.";
  }

  return "";
}

function normalizeLabel(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function areSameLabels(firstLabel: string | null | undefined, secondLabel: string | null | undefined) {
  return Boolean(normalizeLabel(firstLabel) && normalizeLabel(firstLabel) === normalizeLabel(secondLabel));
}

function shouldShowSubgroupLabel(groupLabel: string | null, subgroupLabel: string | null) {
  return Boolean(subgroupLabel && !areSameLabels(subgroupLabel, groupLabel));
}

function formatFieldValue(value: string, unit: string) {
  const normalizedValue = value.trim();
  const normalizedUnit = unit.trim();

  if (!normalizedValue) {
    return "Nao informado";
  }

  if (!normalizedUnit) {
    return normalizedValue;
  }

  return `${normalizedValue} ${normalizedUnit}`;
}

export function InstrumentDetailContent({
  instrumentId
}: InstrumentDetailContentProps) {
  const [item, setItem] = useState<InstrumentDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInstrumentDetail() {
      setIsLoading(true);

      try {
        const response = await fetchApi(`/api/instrumentos?id=${instrumentId}`, {
          method: "GET",
          cache: "no-store"
        });
        const payload = (await response.json()) as InstrumentApiResponse;

        if (!response.ok || !payload.item) {
          if (!isMounted) return;
          setItem(null);
          setLoadError(payload.error ?? "Nao foi possivel carregar o instrumento.");
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;
        setItem(payload.item);
        setLoadError("");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setItem(null);
        setLoadError("Nao foi possivel carregar o instrumento.");
        setIsLoading(false);
      }
    }

    void loadInstrumentDetail();

    return () => {
      isMounted = false;
    };
  }, [instrumentId]);

  const fieldSummary = useMemo(() => {
    if (!item) {
      return { total: 0 };
    }

    return { total: item.fields.length };
  }, [item]);

  const sortedFields = useMemo(() => {
    if (!item) {
      return [];
    }

    return sortMeasurementFields(item.fields);
  }, [item]);

  const groupedFields = useMemo(
    () =>
      groupMeasurementFieldsByLayout(
        sortedFields.map((field) => ({
          ...field,
          slug: field.slug,
          name: field.name
        }))
      ),
    [sortedFields]
  );
  const shouldUseGroupedLayout = useMemo(
    () => hasMeasurementFieldGrouping(sortedFields),
    [sortedFields]
  );

  return (
    <section className="inventory-content instrument-detail-content">
      <div className="instrument-detail-nav">
        <PageTransitionLink href="/instrumentos" className="instrument-detail-back">
          <span aria-hidden="true" className="instrument-detail-back__icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M14.5 6.5 9 12l5.5 5.5M10 12h8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          Voltar para instrumentos
        </PageTransitionLink>

        <div className="instrument-detail-nav__actions">
          <PageTransitionLink
            href={`/instrumentos/${instrumentId}/calibracoes/nova`}
            className="instrument-detail-link-chip instrument-detail-link-chip--primary"
          >
            Registrar calibracao
          </PageTransitionLink>

          <PageTransitionLink
            href={`/instrumentos/${instrumentId}/calibracoes`}
            className="instrument-detail-link-chip"
          >
            Log de calibracoes
          </PageTransitionLink>
        </div>
      </div>

      {isLoading ? (
        <section className="inventory-table-card instrument-detail-card instrument-detail-card--state">
          <p className="inventory-table__empty">Carregando dados do instrumento...</p>
        </section>
      ) : null}

      {!isLoading && loadError ? (
        <section className="inventory-table-card instrument-detail-card instrument-detail-card--state">
          <p className="inventory-table__empty">{loadError}</p>
        </section>
      ) : null}

      {!isLoading && item ? (
        <>
          <section className="inventory-table-card instrument-detail-hero">
            <div className="instrument-detail-hero__top">
              <div className="instrument-detail-hero__copy">
                <p className="instrument-detail-hero__eyebrow">Detalhe do instrumento</p>
                <div className="instrument-detail-hero__heading">
                  <h2>{item.tag}</h2>
                </div>
                <p>{item.category}</p>
              </div>

              <span className={`status-pill status-pill--${item.tone}`}>
                <span className="status-pill__dot" aria-hidden="true" />
                {getStatusLabel(item.tone)}
              </span>
            </div>

            <div className="instrument-detail-hero__grid">
              <article className="instrument-detail-metric">
                <span>Fabricante</span>
                <strong>{item.manufacturer}</strong>
              </article>
              <article className="instrument-detail-metric">
                <span>Prazo de calibracao</span>
                <strong>{item.calibration}</strong>
              </article>
              <article className="instrument-detail-metric">
                <span>Campos configurados</span>
                <strong>{fieldSummary.total}</strong>
              </article>
              <article className="instrument-detail-metric">
                <span>Categoria tecnica</span>
                <strong>{item.categorySlug ?? "Nao informado"}</strong>
              </article>
            </div>
          </section>

          {item.tone !== "neutral" ? (
            <section
              className={`inventory-table-card instrument-detail-alert instrument-detail-alert--${item.tone}`}
            >
              <div>
                <strong>
                  {item.tone === "danger" ? "Instrumento vencido" : "Prazo proximo de vencimento"}
                </strong>
                <p>{getCalibrationAlertCopy(item)}</p>
              </div>

              <PageTransitionLink
                href={`/instrumentos/${instrumentId}/calibracoes/nova`}
                className="instrument-detail-link-chip instrument-detail-link-chip--alert-cta"
              >
                Registrar calibracao agora
              </PageTransitionLink>
            </section>
          ) : null}

          <section className="instrument-detail-grid">
            <article className="inventory-table-card instrument-detail-card instrument-detail-card--full">
              <header className="instrument-detail-card__header">
                <div>
                  <h3>Campos de medicao</h3>
                  <p>Ultimo valor registrado por campo na calibracao mais recente.</p>
                </div>
                <span className="instrument-detail-card__count">{fieldSummary.total} campos</span>
              </header>

              {sortedFields.length === 0 ? (
                <div className="instrument-detail-empty">
                  Nenhum campo de medicao foi configurado para este instrumento.
                </div>
              ) : shouldUseGroupedLayout ? (
                <div className="instrument-detail-grouped-sections">
                  {groupedFields.map((group) => (
                    <section key={group.key} className="instrument-detail-group">
                      {(() => {
                        const groupLabel = group.label || "Campos gerais";
                        const groupedItems = group.subgroups.flatMap((subgroup) =>
                          subgroup.fields.map((field) => ({
                            field,
                            subgroupLabel: shouldShowSubgroupLabel(group.label || null, subgroup.label)
                              ? subgroup.label
                              : null
                          }))
                        );
                        const singleItem = groupedItems[0] ?? null;
                        const showCompactSingleValue =
                          groupedItems.length === 1 &&
                          singleItem &&
                          !singleItem.subgroupLabel &&
                          areSameLabels(singleItem.field.name, groupLabel);

                        return (
                          <>
                            <header className="instrument-detail-group__header">
                              <h4>{groupLabel}</h4>
                              <span>{groupedItems.length} {groupedItems.length === 1 ? "campo" : "campos"}</span>
                            </header>

                            {showCompactSingleValue && singleItem ? (
                              <div className="instrument-detail-group__single">
                                <strong>
                                  {singleItem.field.hasLatestValue
                                    ? formatFieldValue(
                                        singleItem.field.latestValue,
                                        singleItem.field.latestUnit
                                      )
                                    : "Nao informado"}
                                </strong>
                              </div>
                            ) : (
                              <div className="instrument-detail-group__grid">
                                {groupedItems.map(({ field, subgroupLabel }) => {
                                  const shouldShowFieldName =
                                    !areSameLabels(field.name, groupLabel) &&
                                    !areSameLabels(field.name, subgroupLabel);
                                  const resolvedValue = field.hasLatestValue
                                    ? formatFieldValue(field.latestValue, field.latestUnit)
                                    : "Nao informado";

                                  return (
                                    <article key={field.slug} className="instrument-detail-group__field">
                                      {subgroupLabel ? (
                                        <span className="instrument-detail-group__subgroup">{subgroupLabel}</span>
                                      ) : null}
                                      {shouldShowFieldName ? (
                                        <strong className="instrument-detail-group__name">{field.name}</strong>
                                      ) : null}
                                      <span className="instrument-detail-group__value">{resolvedValue}</span>
                                    </article>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </section>
                  ))}
                </div>
              ) : (
                <div className="instrument-detail-fields">
                  {sortedFields.map((field, index) => {
                    const resolvedValue = field.hasLatestValue
                      ? formatFieldValue(field.latestValue, field.latestUnit)
                      : "Nao informado";

                    return (
                      <article key={`${field.slug}-${index}`} className="instrument-detail-field">
                        <div className="instrument-detail-field__top">
                          <strong className="instrument-detail-field__name">{field.name}</strong>
                        </div>
                        <div className="instrument-detail-field__meta">
                          <span className="instrument-detail-field__value">{resolvedValue}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}
    </section>
  );
}
