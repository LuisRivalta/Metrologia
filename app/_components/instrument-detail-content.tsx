"use client";

import { useEffect, useMemo, useState } from "react";
import type { InstrumentDetailItem } from "@/lib/instruments";
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

function getFieldSourceLabel(source: "category" | "instrument") {
  return source === "category" ? "Padrao da categoria" : "Campo extra";
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
        const response = await fetch(`/api/instrumentos?id=${instrumentId}`, {
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
      return {
        total: 0,
        categoryFields: 0,
        instrumentFields: 0
      };
    }

    const categoryFields = item.fields.filter((field) => field.source === "category").length;
    const instrumentFields = item.fields.length - categoryFields;

    return {
      total: item.fields.length,
      categoryFields,
      instrumentFields
    };
  }, [item]);

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

        <PageTransitionLink
          href={`/instrumentos/${instrumentId}/calibracoes`}
          className="instrument-detail-link-chip"
        >
          Log de calibrações
        </PageTransitionLink>
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

          <section className="instrument-detail-grid">
            <article className="inventory-table-card instrument-detail-card instrument-detail-card--full">
              <header className="instrument-detail-card__header">
                <div>
                  <h3>Campos de medicao</h3>
                  <p>Lista completa dos campos associados a este instrumento.</p>
                </div>
                <span className="instrument-detail-card__count">{fieldSummary.total} campos</span>
              </header>

              {item.fields.length === 0 ? (
                <div className="instrument-detail-empty">
                  Nenhum campo de medicao foi configurado para este instrumento.
                </div>
              ) : (
                <div className="instrument-detail-fields">
                  {item.fields.map((field, index) => (
                    <article key={`${field.slug}-${index}`} className="instrument-detail-field">
                      <div className="instrument-detail-field__top">
                        <strong>{field.name}</strong>
                        <span
                          className={`instrument-detail-field__badge instrument-detail-field__badge--${field.source}`}
                        >
                          {getFieldSourceLabel(field.source)}
                        </span>
                      </div>

                      <div className="instrument-detail-field__meta">
                        <span>{field.measurementName || field.measurementRawName || "Sem medida"}</span>
                        <span>Ordem {field.order + 1}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}
    </section>
  );
}
