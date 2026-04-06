"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { ThemeToggle } from "@/app/_components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const {
        data: { session }
      } = await supabaseBrowser.auth.getSession();

      if (session && isMounted) {
        router.replace("/instrumentos");
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const { error } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setErrorMessage("Nao foi possivel entrar. Confira seu e-mail e senha.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/instrumentos");
    router.refresh();
  }

  return (
    <main className="login-screen">
      <ThemeToggle className="login-theme-toggle" />

      <section className="login-layout">
        <div className="login-layout__panel login-layout__panel--left" aria-hidden="true" />
        <div className="login-layout__panel login-layout__panel--right" aria-hidden="true" />
        <div className="login-layout__veil" aria-hidden="true" />

        <section className="login-card">
          <div className="login-card__sheen" aria-hidden="true" />

          <div className="login-card__surface">
            <header className="login-card__brand">
              <div className="logo-mark" aria-hidden="true">
                <Image
                  src="/sidebar-categories.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="brand-mark-image"
                  priority
                />
              </div>

              <div className="login-card__brand-copy">
                <span>Metrologia Pro</span>
                <strong>Bem-vindo de volta</strong>
              </div>
            </header>

            <header className="login-card__header">
              <h2>Login</h2>
              <p>Identifique-se para acessar instrumentos, medicoes e calibracoes.</p>
            </header>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Usuario</span>
                <div className="input-shell">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="m5 7 7 5 7-5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="usuario@empresa.com.br"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="field">
                <span>Senha</span>
                <div className="input-shell">
                  <span className="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M8 10V7.8a4 4 0 1 1 8 0V10"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                      <rect
                        x="5"
                        y="10"
                        width="14"
                        height="10"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M12 13.5v3"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="ghost-icon"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                  </button>
                </div>
              </label>

              <div className="login-form__row">
                <label className="checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Lembrar neste dispositivo</span>
                </label>
              </div>

              {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

              <button type="submit" className="primary-button" disabled={isSubmitting}>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M10 8l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M4 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path
                      d="M14 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                {isSubmitting ? "Entrando..." : "Entrar no sistema"}
              </button>
            </form>
          </div>
        </section>

        <section className="login-hero">
          <div className="login-hero__switch" aria-hidden="true">
            <span className="is-active">login</span>
            <span>sistema</span>
          </div>

          <div className="hero-copy">
            <p className="login-hero__eyebrow">Portal interno</p>
            <h1>Login Metrologico</h1>
            <p>Centralize instrumentos, calibracoes e rastreabilidade em um unico ambiente.</p>
          </div>

          <div className="login-hero__highlight">
            <strong>Conformidade em foco</strong>
            <p>Rotina pronta para auditoria, controle tecnico e acompanhamento operacional.</p>
          </div>

          <footer className="compliance-strip">
            <span>ISO-9001</span>
            <span>Rastreabilidade NIST</span>
          </footer>
        </section>
      </section>
    </main>
  );
}
