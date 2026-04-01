"use client";

import Link from "next/link";

const settingsShortcuts = [
  {
    href: "/configuracoes/medidas",
    title: "Cadastro de medidas",
    description: "Abra a tela de medidas para cadastrar, editar e excluir os tipos usados no sistema."
  }
];

export function SettingsHomeContent() {
  return (
    <section className="inventory-content">
      <section className="inventory-table-card settings-home-card">
        <div className="settings-home-card__header">
          <div>
            <h2>Configurações</h2>
            <p>Escolha uma área para abrir o cadastro correspondente.</p>
          </div>
        </div>

        <div className="settings-home-grid">
          {settingsShortcuts.map((shortcut) => (
            <Link key={shortcut.href} href={shortcut.href} className="settings-shortcut-card">
              <div className="settings-shortcut-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 12h10M12 7l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="settings-shortcut-card__copy">
                <strong>{shortcut.title}</strong>
                <span>{shortcut.description}</span>
              </div>

              <span className="settings-shortcut-card__cta">Abrir cadastro</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
