"use client";

import { useEffect, useState } from "react";
import {
  calibrationFilterOptions,
  type CalibrationFilterPreset,
  type CalibrationHistoryItem
} from "@/lib/calibrations";
import type { InstrumentItem } from "@/lib/instruments";
import { PageTransitionLink } from "./page-transition-link";

type InstrumentCalibrationsContentProps = {
  instrumentId: number;
};

type CalibrationHistoryApiResponse = {
  error?: string;
  instrument?: InstrumentItem;
  items?: CalibrationHistoryItem[];
};

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function getEmptyHistoryMessage(
  tag: string,
  selectedPeriodLabel: string,
  dateFrom: string,
  dateTo: string
) {
  if (dateFrom && dateTo) {
    return `Nenhuma calibração aprovada foi encontrada para ${tag} entre ${formatDateLabel(dateFrom)} e ${formatDateLabel(dateTo)}.`;
  }

  if (dateFrom) {
    return `Nenhuma calibração aprovada foi encontrada para ${tag} a partir de ${formatDateLabel(dateFrom)}.`;
  }

  if (dateTo) {
    return `Nenhuma calibração aprovada foi encontrada para ${tag} até ${formatDateLabel(dateTo)}.`;
  }

  return `Nenhuma calibração aprovada foi encontrada para ${tag} no período de ${selectedPeriodLabel.toLowerCase()}.`;
}

export function InstrumentCalibrationsContent({
  instrumentId
}: InstrumentCalibrationsContentProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<CalibrationFilterPreset>("1y");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [instrument, setInstrument] = useState<InstrumentItem | null>(null);
  const [items, setItems] = useState<CalibrationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          instrumentId: String(instrumentId)
        });

        if (dateFrom || dateTo) {
          if (dateFrom) params.set("dateFrom", dateFrom);
          if (dateTo) params.set("dateTo", dateTo);
        } else {
          params.set("period", selectedPeriod);
        }

        const response = await fetch(`/api/calibracoes?${params.toString()}`, {
          method: "GET",
          cache: "no-store"
        });
        const payload = (await response.json()) as CalibrationHistoryApiResponse;

        if (!response.ok || !payload.instrument || !payload.items) {
          if (!isMounted) return;
          setInstrument(null);
          setItems([]);
          setLoadError(payload.error ?? "Não foi possível carregar o log de calibrações.");
          setIsLoading(false);
          return;
        }

        if (!isMounted) return;
        setInstrument(payload.instrument);
        setItems(payload.items);
        setLoadError("");
        setIsLoading(false);
      } catch {
        if (!isMounted) return;
        setInstrument(null);
        setItems([]);
        setLoadError("Não foi possível carregar o log de calibrações.");
        setIsLoading(false);
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [instrumentId, selectedPeriod, dateFrom, dateTo]);

  const selectedPeriodLabel =
    calibrationFilterOptions.find((option) => option.value === selectedPeriod)?.label ?? "1 ano";

  return (
    <section className="inventory-content instrument-detail-content instrument-calibration-content">
      <div className="instrument-detail-nav instrument-detail-nav--split">
        <PageTransitionLink href={`/instrumentos/${instrumentId}`} className="instrument-detail-back">
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
          Voltar para o instrumento
        </PageTransitionLink>

        <PageTransitionLink href="/instrumentos" className="instrument-detail-link-chip">
          Lista de instrumentos
        </PageTransitionLink>
      </div>

      {isLoading ? (
        <section className="inventory-table-card instrument-detail-card instrument-detail-card--state">
          <p className="inventory-table__empty">Carregando log de calibrações...</p>
        </section>
      ) : null}

      {!isLoading && loadError ? (
        <section className="inventory-table-card instrument-detail-card instrument-detail-card--state">
          <p className="inventory-table__empty">{loadError}</p>
        </section>
      ) : null}

      {!isLoading && instrument ? (
        <>
          <section className="instrument-detail-grid">
            <article className="inventory-table-card instrument-detail-card instrument-detail-card--full">
              <header className="instrument-detail-card__header instrument-calibration-card__header">
                <div>
                  <p className="instrument-detail-hero__eyebrow">Log de calibrações</p>
                  <div className="instrument-calibration-card__heading">
                    <h3>{instrument.tag}</h3>
                  </div>
                  <p>{instrument.category}</p>
                </div>
                <span className="instrument-detail-card__count">{items.length} registros</span>
              </header>

              <div className="instrument-calibration-filters">
                <div className="instrument-calibration-filters__presets" role="tablist" aria-label="Filtrar calibrações por período">
                  {calibrationFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`instrument-calibration-filter-chip${
                        !dateFrom && !dateTo && selectedPeriod === option.value ? " is-active" : ""
                      }`}
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                        setSelectedPeriod(option.value);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="instrument-calibration-filters__custom">
                  <label className="instrument-calibration-date-field">
                    <span>Data inicial</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(event) => setDateFrom(event.target.value)}
                    />
                  </label>

                  <label className="instrument-calibration-date-field">
                    <span>Data final</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(event) => setDateTo(event.target.value)}
                    />
                  </label>

                  {dateFrom || dateTo ? (
                    <button
                      type="button"
                      className="instrument-calibration-filter-clear"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                    >
                      Limpar intervalo
                    </button>
                  ) : null}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="instrument-detail-empty instrument-calibration-empty">
                  {getEmptyHistoryMessage(instrument.tag, selectedPeriodLabel, dateFrom, dateTo)}
                </div>
              ) : (
                <div className="instrument-calibration-list">
                  {items.map((item) => (
                    <article key={item.id} className="instrument-calibration-entry">
                      <div className="instrument-calibration-entry__top">
                        <div className="instrument-calibration-entry__title">
                          <strong>{item.certificate}</strong>
                          <p>{item.calibrationDate}</p>
                        </div>

                        <span className={`status-pill status-pill--${item.statusTone}`}>
                          <span className="status-pill__dot" aria-hidden="true" />
                          {item.statusLabel}
                        </span>
                      </div>

                      <div className="instrument-calibration-entry__grid">
                        <div className="instrument-calibration-entry__meta">
                          <span>Emissão do certificado</span>
                          <strong>{item.certificateDate}</strong>
                        </div>
                        <div className="instrument-calibration-entry__meta">
                          <span>Data de validade</span>
                          <strong>{item.validityDate}</strong>
                        </div>
                        <div className="instrument-calibration-entry__meta">
                          <span>Laboratório</span>
                          <strong>{item.laboratory}</strong>
                        </div>
                        <div className="instrument-calibration-entry__meta">
                          <span>Responsável</span>
                          <strong>{item.responsible}</strong>
                        </div>
                        <div className="instrument-calibration-entry__meta">
                          <span>Resultados conformes</span>
                          <strong>
                            {item.totalResults > 0
                              ? `${item.conformingResults}/${item.totalResults}`
                              : "Sem resultados"}
                          </strong>
                        </div>
                        <div className="instrument-calibration-entry__meta">
                          <span>Resultados não conformes</span>
                          <strong>{item.nonConformingResults}</strong>
                        </div>
                      </div>

                      {item.observations ? (
                        <p className="instrument-calibration-entry__notes">{item.observations}</p>
                      ) : null}

                      {item.certificateUrl ? (
                        <div className="instrument-calibration-entry__actions">
                          <a
                            href={item.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="instrument-detail-link-chip"
                          >
                            Abrir certificado
                          </a>
                        </div>
                      ) : null}
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
