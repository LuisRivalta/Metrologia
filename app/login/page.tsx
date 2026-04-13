"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import BorderGlow from "@/app/_components/border-glow";
import LightPillar from "@/app/_components/light-pillar";
import ShinyText from "@/app/_components/shiny-text";
import { syncSupabaseSessionCookies } from "@/lib/supabase/auth-session";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [isLoginDenied, setIsLoginDenied] = useState(false);
  const shakeTimeoutRef = useRef<number | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    void router.prefetch("/dashboard");

    async function checkSession() {
      const {
        data: { session }
      } = await supabaseBrowser.auth.getSession();

      if (session && isMounted) {
        syncSupabaseSessionCookies(session);
        router.replace("/dashboard");
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }

      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  function redirectToDashboard() {
    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current);
    }

    const navigate = () => {
      router.replace("/dashboard");
      router.refresh();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate();
      return;
    }

    setIsRedirecting(true);
    redirectTimeoutRef.current = window.setTimeout(navigate, 320);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setValidationMessage("");

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      setIsLoginDenied(true);
      setValidationMessage("Preencha os campos.");

      if (shakeTimeoutRef.current) {
        window.clearTimeout(shakeTimeoutRef.current);
      }

      shakeTimeoutRef.current = window.setTimeout(() => {
        setIsLoginDenied(false);
      }, 460);

      return;
    }

    setIsSubmitting(true);
    setIsRedirecting(false);
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseBrowser.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    if (error) {
      setErrorMessage("Não foi possível entrar. Confira seu e-mail e senha.");
      setIsSubmitting(false);
      return;
    }

    syncSupabaseSessionCookies(data.session ?? null);
    redirectToDashboard();
  }

  return (
    <main className={`login-screen${isRedirecting ? " is-transitioning" : ""}`}>
      <div className="login-screen__transition-wave" aria-hidden="true" />
      <section className="login-layout">
        <div className="login-layout__backdrop" aria-hidden="true">
          <LightPillar
            className="login-layout__pillar"
            topColor="#44dfff"
            bottomColor="#2f63ff"
            intensity={2}
            rotationSpeed={0.34}
            glowAmount={0.0005}
            pillarWidth={9}
            pillarHeight={0.4}
            noiseIntensity={0.02}
            pillarRotation={25}
            quality="high"
          />
        </div>
        <div className="login-layout__tint" aria-hidden="true" />
        <div className="login-layout__panel login-layout__panel--left" aria-hidden="true" />
        <div className="login-layout__panel login-layout__panel--right" aria-hidden="true" />
        <div className="login-layout__veil" aria-hidden="true" />

        <BorderGlow
          className="login-card-glow"
          edgeSensitivity={30}
          glowColor="208 92 78"
          backgroundColor="linear-gradient(180deg, rgba(16, 17, 21, 0.58) 0%, rgba(10, 11, 16, 0.5) 100%)"
          borderRadius={28}
          glowRadius={31}
          glowIntensity={1.9}
          coneSpread={25}
          animated={false}
          colors={["#4f7dff", "#38bdf8", "#7dd3fc"]}
          fillOpacity={0.24}
        >
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
              </header>

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                <label className="field">
                  <span>Usuário</span>
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
                      disabled={isSubmitting || isRedirecting}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setValidationMessage("");
                      }}
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
                      disabled={isSubmitting || isRedirecting}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setValidationMessage("");
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="ghost-icon"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      disabled={isSubmitting || isRedirecting}
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

                {errorMessage ? <p className="login-error">{errorMessage}</p> : null}

                <div className="login-submit-row">
                  <button
                    type="submit"
                    className={`primary-button${isLoginDenied ? " is-shaking" : ""}`}
                    disabled={isSubmitting || isRedirecting}
                  >
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
                    {isRedirecting
                      ? "Abrindo dashboard..."
                      : isSubmitting
                        ? "Entrando..."
                        : "Entrar no sistema"}
                  </button>

                  {validationMessage ? (
                    <p className="login-inline-error">{validationMessage}</p>
                  ) : null}
                </div>
              </form>
            </div>
          </section>
        </BorderGlow>

        <section className="login-hero">
          <div className="hero-copy">
            <h1>
              <ShinyText
                text="Metrologia Pro"
                speed={4.2}
                color="#e6f1ff"
                shineColor="#59c8ff"
                spread={92}
                delay={1.2}
              />
            </h1>
          </div>

          <div className="login-hero__highlight">
            <strong>Conformidade em foco</strong>
            <p>Rotina pronta para auditoria, controle técnico e acompanhamento operacional.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
