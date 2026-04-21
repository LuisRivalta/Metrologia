import Link from "next/link";
import { getDashboardMetrics } from "@/lib/dashboard-metrics";

const breakdownToneToStatus: Record<"ok" | "warning" | "danger", string> = {
  ok: "neutral",
  warning: "warning",
  danger: "danger"
};

export async function DashboardContent() {
  const metrics = await getDashboardMetrics();
  const okCount = Math.max(metrics.totalInstruments - metrics.warningCount - metrics.dangerCount, 0);
  const chartRadius = 52;
  const chartCircumference = 2 * Math.PI * chartRadius;
  const statusSegments = [
    {
      key: "ok",
      count: okCount,
      className: "dashboard-status-card__segment dashboard-status-card__segment--ok"
    },
    {
      key: "warning",
      count: metrics.warningCount,
      className: "dashboard-status-card__segment dashboard-status-card__segment--warning"
    },
    {
      key: "danger",
      count: metrics.dangerCount,
      className: "dashboard-status-card__segment dashboard-status-card__segment--danger"
    }
  ];
  let accumulatedLength = 0;
  const renderedSegments = statusSegments
    .filter((segment) => segment.count > 0 && metrics.totalInstruments > 0)
    .map((segment) => {
      const segmentLength = (segment.count / metrics.totalInstruments) * chartCircumference;
      const segmentOffset = -accumulatedLength;
      accumulatedLength += segmentLength;

      return {
        ...segment,
        dashArray: `${segmentLength} ${chartCircumference - segmentLength}`,
        dashOffset: `${segmentOffset}`
      };
    });

  return (
    <section className="inventory-content dashboard-content">
      <section className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="dashboard-hero__eyebrow">Visão central de conformidade</p>
          <h2>Dashboard de Controle</h2>
          <p>Base atual dos instrumentos da aplicação, com foco em prazo de calibração e status do parque.</p>
        </div>

        <div className="dashboard-hero__meta">
          <span className="dashboard-status-pill">
            <span className="dashboard-status-pill__dot" aria-hidden="true" />
            {metrics.totalInstruments} instrumentos monitorados
          </span>
          <span className="dashboard-audit-pill">{metrics.requiringAttentionCount} com atenção ao prazo</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-grid__stack">
          {metrics.summaryCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={`inventory-table-card dashboard-card dashboard-summary-card dashboard-summary-card--${card.tone}`}
            >
              <div className="dashboard-summary-card__top">
                <div className={`dashboard-summary-card__icon dashboard-summary-card__icon--${card.tone}`}>
                  {card.title === "Total instrumentos" ? (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M7 5.5h10M8.2 3.5h7.6M9.3 5.5v5.2l-2.4 4.9A2 2 0 0 0 8.7 19h6.6a2 2 0 0 0 1.8-3.4l-2.4-4.9V5.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M9.2 13.1h5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5.5 7.5h5v5h-5zM13.5 7.5h5v5h-5zM5.5 15.5h5v5h-5zM13.5 15.5h5v5h-5z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                <div className="dashboard-summary-card__row">
                  <span>{card.title}</span>
                  {card.note ? <strong>{card.note}</strong> : null}
                </div>
              </div>

              <div className="dashboard-summary-card__body">
                <p>{card.value}</p>
              </div>
            </Link>
          ))}
        </div>

        <article className="inventory-table-card dashboard-card dashboard-highlight-card">
          <div className="dashboard-highlight-card__header">
            <div>
              <span className="dashboard-card__kicker">Instrumentos calibrados</span>
              <div className="dashboard-highlight-card__metric">
                <strong>{metrics.inCompliancePercentage}%</strong>
                <p>
                  {metrics.inComplianceCount} de {metrics.totalInstruments} dentro do prazo
                </p>
              </div>
            </div>

            <div className="dashboard-highlight-card__badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M6.5 12.5 10 16l7.5-8"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="dashboard-highlight-card__progress" aria-hidden="true">
            <span style={{ width: `${metrics.inCompliancePercentage}%` }} />
          </div>

          <div className="dashboard-highlight-card__foot">
            <span>{metrics.warningCount} perto de vencer</span>
            <span>{metrics.dangerCount} vencidos</span>
          </div>
        </article>
      </section>

      <section className="dashboard-lower-grid">
        <article className="inventory-table-card dashboard-card dashboard-alert-card">
          <header className="dashboard-card__header">
            <div>
              <h3>Alertas de Vencimento</h3>
              <p>Instrumentos mais próximos do vencimento ou já vencidos na base atual.</p>
            </div>
            <span className="dashboard-link-button">{metrics.alerts.length} itens críticos</span>
          </header>

          <div className="dashboard-alert-list">
            {metrics.alerts.map((alert) => (
              <Link
                key={alert.tag}
                href={`/instrumentos/${alert.id}`}
                className={`dashboard-alert-item dashboard-alert-item--${alert.tone}`}
              >
                <div className="dashboard-alert-item__icon" aria-hidden="true">
                  {alert.tone === "danger" ? (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 7v6M12 17.2h.01M4.9 18.5h14.2c1.1 0 1.8-1.2 1.2-2.1L13.1 4.3a1.3 1.3 0 0 0-2.2 0L3.7 16.4c-.6.9.1 2.1 1.2 2.1Z"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 6.5v5.3l3.1 1.9M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                <div className="dashboard-alert-item__body">
                  <div className="dashboard-alert-item__title-row">
                    <strong>{alert.tag}</strong>
                    <span>{alert.title}</span>
                  </div>
                  <p>{alert.note}</p>
                </div>

                <span className={`dashboard-alert-item__badge dashboard-alert-item__badge--${alert.tone}`}>
                  {alert.badgeLabel}
                </span>
              </Link>
            ))}
          </div>
        </article>

        <article className="inventory-table-card dashboard-card dashboard-status-card">
          <header className="dashboard-card__header dashboard-card__header--compact">
            <div>
              <h3>Status de Conformidade</h3>
              <p>No prazo considera os instrumentos em dia e também os que estão perto de vencer.</p>
            </div>
          </header>

          <div className="dashboard-status-card__visual" aria-hidden="true">
            <div className="dashboard-status-card__chart">
              <svg viewBox="0 0 160 160" className="dashboard-status-card__svg" role="presentation">
                <circle className="dashboard-status-card__track" cx="80" cy="80" r={chartRadius} />
                <g transform="rotate(-90 80 80)">
                  {renderedSegments.map((segment) => (
                    <circle
                      key={segment.key}
                      className={segment.className}
                      cx="80"
                      cy="80"
                      r={chartRadius}
                      strokeDasharray={segment.dashArray}
                      strokeDashoffset={segment.dashOffset}
                    />
                  ))}
                </g>
              </svg>

              <div className="dashboard-status-card__plate">
                <strong>{metrics.inCompliancePercentage}%</strong>
                <span>no prazo</span>
              </div>
            </div>
          </div>

          <div className="dashboard-status-card__legend">
            {metrics.breakdown.map((item) => (
              <Link
                key={item.label}
                href={`/instrumentos?status=${breakdownToneToStatus[item.tone]}`}
                className="dashboard-status-card__legend-row"
              >
                <div className="dashboard-status-card__legend-label">
                  <span className={`dashboard-status-card__swatch dashboard-status-card__swatch--${item.tone}`} />
                  <p>{item.label}</p>
                </div>

                <div className="dashboard-status-card__legend-values">
                  <strong>{item.count} instrumentos</strong>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
