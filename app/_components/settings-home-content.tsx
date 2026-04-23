"use client";

import { useEffect, useState } from "react";
import { PageTransitionLink } from "./page-transition-link";

type FontScale = "sm" | "md" | "lg";

const FONT_SCALE_STORAGE_KEY = "metrologia-font-scale";

const settingsShortcuts = [
  {
    href: "/configuracoes/medidas",
    title: "Cadastro de medidas",
    description: "Abra a tela de medidas para cadastrar, editar e excluir os tipos usados no sistema."
  },
  {
    href: "/configuracoes/setores",
    title: "Cadastro de setores",
    description: "Abra a tela de setores para cadastrar, editar e excluir os setores de uso dos instrumentos."
  }
];

function applyFontScale(scale: FontScale) {
  document.documentElement.dataset.fontScale = scale;
}

function getStoredFontScale(): FontScale {
  if (typeof window === "undefined") {
    return "md";
  }

  try {
    const storedScale = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    return storedScale === "sm" || storedScale === "lg" ? storedScale : "md";
  } catch {
    return "md";
  }
}

export function SettingsHomeContent() {
  const [fontScale, setFontScale] = useState<FontScale>("md");

  useEffect(() => {
    const nextScale = getStoredFontScale();
    setFontScale(nextScale);
    applyFontScale(nextScale);
  }, []);

  function handleFontScaleChange(nextScale: FontScale) {
    setFontScale(nextScale);
    applyFontScale(nextScale);

    try {
      window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, nextScale);
    } catch {
      // Mantem a escolha apenas na sessao atual se o armazenamento falhar.
    }
  }

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
            <PageTransitionLink
              key={shortcut.href}
              href={shortcut.href}
              className="settings-shortcut-card"
            >
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
            </PageTransitionLink>
          ))}

          <article className="settings-shortcut-card settings-accessibility-card">
            <div className="settings-shortcut-card__icon settings-accessibility-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 19 12 5l6 14M8.2 14h7.6"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="settings-shortcut-card__copy">
              <strong>Acessibilidade</strong>
              <span>
                Ajuste o tamanho da fonte da interface para facilitar a leitura. A preferencia fica salva neste
                navegador.
              </span>
            </div>

            <div className="settings-font-scale" role="group" aria-label="Ajustar tamanho da fonte">
              <button
                type="button"
                className={`settings-font-scale__button${fontScale === "sm" ? " is-active" : ""}`}
                aria-pressed={fontScale === "sm"}
                onClick={() => handleFontScaleChange("sm")}
              >
                A-
              </button>
              <button
                type="button"
                className={`settings-font-scale__button${fontScale === "md" ? " is-active" : ""}`}
                aria-pressed={fontScale === "md"}
                onClick={() => handleFontScaleChange("md")}
              >
                A
              </button>
              <button
                type="button"
                className={`settings-font-scale__button${fontScale === "lg" ? " is-active" : ""}`}
                aria-pressed={fontScale === "lg"}
                onClick={() => handleFontScaleChange("lg")}
              >
                A+
              </button>
            </div>

            <p className="settings-accessibility-card__note">
              Use <strong>A-</strong> para reduzir, <strong>A</strong> para o tamanho padrao e <strong>A+</strong>{" "}
              para aumentar a fonte.
            </p>
          </article>
        </div>
      </section>
    </section>
  );
}
