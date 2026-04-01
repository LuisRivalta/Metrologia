import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SidebarUserBar } from "./sidebar-user-bar";
import { ThemeToggle } from "./theme-toggle";

type SectionKey = "dashboard" | "instrumentos" | "categorias" | "configuracoes";

type SidebarItem = {
  key: SectionKey;
  label: string;
  href: string;
  iconSrc: string;
};

type ManagementShellProps = {
  activeItem: SectionKey;
  children: ReactNode;
};

const sidebarItems: SidebarItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    iconSrc: "/sidebar-dashboard.svg"
  },
  {
    key: "instrumentos",
    label: "Instrumentos",
    href: "/instrumentos",
    iconSrc: "/sidebar-categories.svg"
  },
  {
    key: "categorias",
    label: "Adicionar Categoria",
    href: "/categorias",
    iconSrc: "/sidebar-instruments.svg"
  },
  {
    key: "configuracoes",
    label: "Configurações",
    href: "/configuracoes",
    iconSrc: "/sidebar-settings.svg"
  }
];

export function ManagementShell({ activeItem, children }: ManagementShellProps) {
  return (
    <main className="inventory-page">
      <aside className="inventory-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand__mark" aria-hidden="true">
            <Image
              src="/sidebar-categories.svg"
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
            <Link
              key={item.key}
              href={item.href}
              className={`sidebar-link${item.key === activeItem ? " is-active" : ""}`}
            >
              <span className="sidebar-link__icon" aria-hidden="true">
                <Image
                  src={item.iconSrc}
                  alt=""
                  width={24}
                  height={24}
                  className="sidebar-link__image"
                />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-account">
          <SidebarUserBar />
        </div>
      </aside>

      <section className="inventory-shell">
        <header className="inventory-topbar">
          <div className="topbar-left">
            <div className="topbar-title">Metrologia PRO</div>
          </div>

          <div className="topbar-right">
            <ThemeToggle />
          </div>
        </header>

        {children}

        <footer className="inventory-footer">
          <span>(c) 2024 Metrologia Pro. Precisão pronta para auditoria.</span>
        </footer>
      </section>
    </main>
  );
}

export function PlaceholderSection({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="inventory-content">
      <section className="inventory-table-card placeholder-card">
        <div className="placeholder-card__body">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </section>
    </section>
  );
}
