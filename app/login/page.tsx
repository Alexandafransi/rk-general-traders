"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../lib/auth/AuthContext";
import { LocaleProvider, useLocale } from "../dashboard/i18n/LocaleContext";
import Icon from "../dashboard/Icon";
import "./login.css";

export default function LoginPage() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    </LocaleProvider>
  );
}

function LoginScreen() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const { user, loading, login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  // The site-wide theme preference lives in localStorage under "rk_theme"
  // (same key the marketing homepage's toggle uses) — read it on mount since
  // this route doesn't share the homepage's theme-init script.
  useEffect(() => {
    const stored = window.localStorage.getItem("rk_theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("rk_theme", next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await login(identifier.trim(), password);
    setSubmitting(false);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="login-root">
      <aside className="login-hero">
        <LoginIllustration />
        <div className="login-brand">
          <span className="mark">RK</span>
          <span className="word">
            {t("auth.login.brandTitle")}
            <small>{t("auth.login.brandTagline")}</small>
          </span>
        </div>

        <div className="login-hero-body">
          <h1>{t("auth.login.heroHeadline")}</h1>
          <ul className="login-hero-list">
            {[t("auth.login.heroBullet1"), t("auth.login.heroBullet2"), t("auth.login.heroBullet3")].map((b) => (
              <li key={b}>
                <span className="tick">
                  <Icon name="check" size={12} strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="login-hero-footer">{t("auth.login.footer", { year: new Date().getFullYear() })}</div>
      </aside>

      <div className="login-formside">
        <div className="login-topbar">
          <button
            type="button"
            className="login-theme-btn"
            aria-label={theme === "dark" ? t("auth.login.lightMode") : t("auth.login.darkMode")}
            onClick={toggleTheme}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {theme === "dark" ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
                </>
              ) : (
                <path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z" />
              )}
            </svg>
          </button>
          <div className="login-lang" role="tablist" aria-label={t("nav.language")}>
            <button role="tab" aria-selected={locale === "en"} onClick={() => setLocale("en")}>
              EN
            </button>
            <button role="tab" aria-selected={locale === "sw"} onClick={() => setLocale("sw")}>
              SW
            </button>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-mark login-brand">
            <span className="mark">RK</span>
            <span className="word">
              {t("auth.login.brandTitle")}
              <small>{t("auth.login.brandTagline")}</small>
            </span>
          </div>

          <h2>{t("auth.login.title")}</h2>
          <p className="sub">{t("auth.login.subtitle")}</p>

          {error && (
            <div className="login-error" role="alert">
              <Icon name="life" size={15} />
              {t(error)}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-identifier">{t("auth.login.identifier")}</label>
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                placeholder={t("auth.login.identifierPlaceholder")}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">{t("auth.login.password")}</label>
              <div className="login-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t("auth.login.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="has-toggle"
                />
                <button
                  type="button"
                  className="login-toggle-visibility"
                  aria-label={showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} size={16} />
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="login-spinner" />
                  {t("auth.login.submitting")}
                </>
              ) : (
                <>
                  <Icon name="key" size={16} />
                  {t("auth.login.submit")}
                </>
              )}
            </button>
          </form>

          <div className="login-form-footer">{t("auth.login.footer", { year: new Date().getFullYear() })}</div>
        </div>
      </div>
    </div>
  );
}

/** A router beaming coverage out to three connected sites — the same visual
 * language as the marketing site's hero illustration, rebuilt for a tall
 * narrow panel. Colors come entirely from CSS vars, so it re-themes for
 * free with the rest of the page. */
function LoginIllustration() {
  // Kept to the right ~35% of the viewBox (x >= ~260) with generous margin,
  // since the headline/bullet text on the left can run close to its own
  // column edge — see login.css's .login-hero-body max-width for the other
  // half of that safety margin.
  const cable1 = "M340,110 C315,225 305,300 298,410";
  const cable2 = "M340,110 C352,240 336,340 326,470";
  const cable3 = "M340,110 C382,230 397,320 377,475";
  return (
    <svg className="login-illustration" viewBox="0 0 420 620" fill="none" aria-hidden="true">
      <circle className="il-wave w1" cx="340" cy="110" r="34" stroke="var(--signal)" strokeWidth="1.4" />
      <circle className="il-wave w2" cx="340" cy="110" r="56" stroke="var(--signal)" strokeWidth="1.2" />
      <circle className="il-wave w3" cx="340" cy="110" r="78" stroke="var(--signal)" strokeWidth="1" />

      <g className="il-router">
        <rect x="297" y="94" width="86" height="28" rx="7" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" />
        <circle cx="311" cy="108" r="2.3" fill="var(--signal)" />
        <circle cx="323" cy="108" r="2.3" fill="var(--red)" />
        <line x1="308" y1="94" x2="301" y2="76" stroke="var(--ink-dim)" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="340" y1="94" x2="340" y2="72" stroke="var(--ink-dim)" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="372" y1="94" x2="379" y2="76" stroke="var(--ink-dim)" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      <path d={cable1} stroke="var(--line)" strokeWidth="1.5" />
      <path d={cable2} stroke="var(--line)" strokeWidth="1.5" />
      <path d={cable3} stroke="var(--line)" strokeWidth="1.5" />

      <circle className="il-flow d1" r="3.2" fill="var(--signal)" style={{ offsetPath: `path('${cable1}')` }} />
      <circle className="il-flow d2" r="3.2" fill="var(--red)" style={{ offsetPath: `path('${cable2}')` }} />
      <circle className="il-flow d3" r="3.2" fill="var(--signal)" style={{ offsetPath: `path('${cable3}')` }} />

      <g>
        <circle cx="298" cy="410" r="5.2" fill="var(--surface)" stroke="var(--signal)" strokeWidth="1.6" />
        <circle cx="326" cy="470" r="5.2" fill="var(--surface)" stroke="var(--red)" strokeWidth="1.6" />
        <circle cx="377" cy="475" r="5.2" fill="var(--surface)" stroke="var(--signal)" strokeWidth="1.6" />
      </g>
    </svg>
  );
}
