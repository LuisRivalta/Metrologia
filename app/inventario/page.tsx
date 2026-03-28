import type { ReactNode } from "react";
import Image from "next/image";

type SidebarItem = {
  label: string;
  active?: boolean;
  icon: ReactNode;
};

type InventoryRow = {
  tag: string;
  category: string;
  manufacturer: string;
  calibration: string;
  tone: "neutral" | "warning" | "danger";
};

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="0.9" fill="currentColor" />
        <rect x="13" y="3" width="8" height="8" rx="0.9" fill="currentColor" />
        <rect x="3" y="13" width="8" height="8" rx="0.9" fill="currentColor" />
        <rect x="13" y="13" width="8" height="8" rx="0.9" fill="currentColor" />
      </svg>
    )
  },
  {
    label: "Instrumentos",
    active: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M4.5 8.5h5m-5 2.5h5m-4-4V5.2c0-.5.4-.9.9-.9h.7v3.4m2.3-.7V5c0-.3.1-.5.3-.7l1.3-1.3v5.6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.2 6.8v11.6m1.8-10.1v9m3.1-7h4.9a1.5 1.5 0 0 1 1.5 1.5v1.7a1.6 1.6 0 0 1-1.6 1.6h-.8a1.9 1.9 0 0 1-1.5-.7l-.4-.5h-2.1m6.4-3.3h1.9v3.4h-1.9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
  {
    label: "Categorias",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 4 16.8 12H7.2L12 4Z" fill="currentColor" />
        <rect x="4" y="14" width="7" height="7" rx="1.1" fill="currentColor" />
        <circle cx="17.5" cy="17.5" r="3.5" fill="currentColor" />
      </svg>
    )
  },
  {
    label: "Configurações",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3.6 14 5l2.3-.4 1.1 2 2.1 1 .1 2.3 1.5 1.8-1 2.1 1 2.1-1.5 1.8-.1 2.3-2.1 1-1.1 2-2.3-.4-2 1.4-2-1.4-2.3.4-1.1-2-2.1-1-.1-2.3L3 14l1-2.1-1-2.1 1.5-1.8.1-2.3 2.1-1 1.1-2L10 5l2-1.4Z"
          fill="currentColor"
        />
        <circle cx="12" cy="12" r="3.2" fill="#f4f7ff" />
      </svg>
    )
  }
];

const rows: InventoryRow[] = [
  {
    tag: "PL-001",
    category: "Manômetro Digital",
    manufacturer: "WIKA Group",
    calibration: "12 Mar 2025 (Em 4 meses)",
    tone: "neutral"
  },
  {
    tag: "PQ-042",
    category: "Paquímetro Digital",
    manufacturer: "Mitutoyo",
    calibration: "15 Out 2024 (Vence em 2 dias)",
    tone: "warning"
  },
  {
    tag: "TM-088",
    category: "Termômetro Infravermelho",
    manufacturer: "Fluke Corp",
    calibration: "02 Jan 2025 (Em 2 meses)",
    tone: "neutral"
  },
  {
    tag: "MG-012",
    category: "Micrômetro Externo",
    manufacturer: "Mitutoyo",
    calibration: "20 Ago 2024 (Vencido há 2 meses)",
    tone: "danger"
  }
];

export default function InventarioPage() {
  return (
    <main className="inventory-page">
      <aside className="inventory-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand__mark" aria-hidden="true">
            <Image
              src="/brand-logo.svg"
              alt=""
              width={28}
              height={28}
              className="brand-mark-image"
              priority
            />
          </div>

          <div>
            <h1>Controle de Estoque</h1>
            <p>Conformidade ISO-9001</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Menu principal">
          {sidebarItems.map((item) => (
            <a
              key={item.label}
              href="/inventario"
              className={`sidebar-link${item.active ? " is-active" : ""}`}
            >
              <span className="sidebar-link__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-cta">
          <button type="button" className="sidebar-cta__button">
            <span aria-hidden="true">+</span>
            <strong>Adicionar Equipamento</strong>
          </button>
        </div>
      </aside>

      <section className="inventory-shell">
        <header className="inventory-topbar">
          <div className="topbar-left">
            <div className="topbar-title">Metrologia PRO</div>
          </div>

          <div className="topbar-right">
            <button type="button" className="icon-button" aria-label="Notificações">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 4a4 4 0 0 1 4 4v2.4c0 .8.2 1.7.7 2.4l1.1 1.8H6.2l1.1-1.8c.5-.7.7-1.6.7-2.4V8a4 4 0 0 1 4-4Z"
                  fill="currentColor"
                />
                <path
                  d="M9.5 18a2.5 2.5 0 0 0 5 0"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <button type="button" className="icon-button" aria-label="Ajuda">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                <path
                  d="M9.7 9.3a2.5 2.5 0 1 1 4 2c-.9.6-1.7 1.1-1.7 2.2m0 3h.1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="profile-card">
              <div className="profile-copy">
                <strong>Metrologista Chefe</strong>
                <span>ADMIN MASTER</span>
              </div>

              <div className="profile-avatar" aria-hidden="true">
                <span>MC</span>
              </div>
            </div>
          </div>
        </header>

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
                placeholder="Pesquisar instrumentos por Tag, Serial ou Categoria"
              />
            </label>

            <button type="button" className="toolbar-button">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 7h14M8 12h8M10 17h4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Filtros
            </button>

            <button type="button" className="toolbar-button">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5v9m0 0 4-4m-4 4-4-4M5 19h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Exportar CSV
            </button>

            <button type="button" className="primary-toolbar-button">
              <span className="primary-toolbar-button__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 7v10M7 12h10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Adicionar Novo Instrumento
            </button>
          </div>

          <section className="inventory-table-card">
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Categoria</th>
                    <th>Fabricante</th>
                    <th>Prazo de calibração</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.tag}>
                      <td data-label="Tag">
                        <span className="tag-pill">{row.tag}</span>
                      </td>
                      <td data-label="Categoria">{row.category}</td>
                      <td data-label="Fabricante">{row.manufacturer}</td>
                      <td data-label="Prazo de calibração">
                        <span className={`status-pill status-pill--${row.tone}`}>
                          <span className="status-pill__dot" aria-hidden="true" />
                          {row.calibration}
                        </span>
                      </td>
                      <td data-label="Ações">
                        <button type="button" className="table-action" aria-label="Editar">
                          <svg viewBox="0 0 24 24" fill="none">
                            <path
                              d="M4 16.8V20h3.2L18 9.2 14.8 6 4 16.8Z"
                              fill="currentColor"
                            />
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
              <p>Exibindo 1-4 de 128 itens</p>

              <div className="pagination" aria-label="Paginação">
                <button type="button" className="pagination-button pagination-button--muted">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="m14 7-5 5 5 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button type="button" className="pagination-button is-current">
                  1
                </button>
                <button type="button" className="pagination-button">
                  2
                </button>
                <button type="button" className="pagination-button">
                  3
                </button>
                <button type="button" className="pagination-button pagination-button--muted">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="m10 7 5 5-5 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </section>

        <footer className="inventory-footer">
          <span>(c) 2024 Metrologia Pro. Precisão pronta para auditoria.</span>

          <div className="inventory-footer__links">
            <a href="/inventario">Documentação</a>
            <a href="/inventario">Suporte</a>
            <a href="/inventario" className="is-active">
              Status do sistema
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
