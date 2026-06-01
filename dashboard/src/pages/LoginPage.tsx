import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Shirt, Eye, EyeOff, Mail, Lock, Sun, Moon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const validate = () => {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Podaj poprawny adres e-mail';
    if (password.length < 1) next.password = 'Hasło jest wymagane';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Zalogowano');
      navigate('/dashboard');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Logowanie nie powiodło się'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ff-auth-shell" data-auth-theme={theme}>
      <div className="ff-auth-layout">
        <aside className="ff-auth-hero">
          <div className="ff-auth-grid-layer" />
          <div className="ff-auth-glow ff-auth-glow-a" />
          <div className="ff-auth-glow ff-auth-glow-b" />

          <div className="ff-auth-hero-top">
            <div className="ff-auth-brand">
              <span className="ff-auth-mark">
                <Shirt size={15} />
              </span>
              <span>
                FashionFit <b>AI</b>
              </span>
            </div>
          </div>

          <div className="ff-auth-hero-mid">
            <div className="ff-auth-core-wrap" aria-hidden="true">
              <div className="ff-auth-core-ring" />
              <span className="ff-ai-core ff-auth-core" />
            </div>

            <p className="ff-auth-kicker">Studio Commerce Intelligence</p>
            <h1 className="ff-auth-title">
              Twój sklep dostaje
              <br />
              <span className="ff-auth-title-grad">osobistego stylistę AI.</span>
            </h1>
            <p className="ff-auth-copy">
              Zaloguj się do Studio i zobacz, jak FashionFit AI podnosi konwersję, dobiera rozmiary i prowadzi klienta do zakupu.
            </p>

            <div className="ff-auth-metrics" aria-hidden="true">
              <div>
                <b>+34%</b>
                <span>wyższa konwersja</span>
              </div>
              <div>
                <b>-28%</b>
                <span>mniej zwrotów</span>
              </div>
              <div>
                <b>120+</b>
                <span>sklepów w PL</span>
              </div>
            </div>
          </div>

          <div className="ff-auth-hero-bot">
            <div className="ff-auth-quote">
              <p>"Wdrożenie zajęło 5 minut. Po miesiącu konwersja w kategorii sukienek wzrosła o jedną trzecią."</p>
              <div className="ff-auth-quote-byline">
                <span className="ff-auth-quote-avatar">AN</span>
                <span>
                  <b>Atelier Nord</b>
                  butik premium · Warszawa
                </span>
              </div>
            </div>
          </div>
        </aside>

        <section className="ff-auth-panel">
          <div className="ff-auth-topbar">
            <Link to="/" className="ff-auth-back-link">
              <ArrowLeft size={14} />
              <span>Wróć</span>
            </Link>
            <button
              type="button"
              className="ff-auth-theme-toggle ff-focus-ring"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              aria-label={theme === 'light' ? 'Przełącz na tryb ciemny' : 'Przełącz na tryb jasny'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          <div className="ff-auth-mobile-brand">
            <span className="ff-auth-mark">
              <Shirt size={15} />
            </span>
            <span>
              FashionFit <b>AI</b>
            </span>
          </div>

          <div className="ff-auth-form-wrap">
            <nav className="ff-auth-switch" aria-label="Nawigacja logowanie/rejestracja">
              <span className="ff-auth-switch-item ff-auth-switch-item-active">Logowanie</span>
              <Link to="/register" className="ff-auth-switch-item">Rejestracja</Link>
            </nav>

            <div className="ff-auth-heading">
              <h2 className="ff-auth-panel-title">Witaj ponownie</h2>
              <p className="ff-auth-panel-copy">Zaloguj się do FashionFit Studio.</p>
            </div>

            <button type="button" className="ff-auth-sso-button ff-focus-ring" disabled aria-disabled="true">
              <span className="ff-auth-google-dot" aria-hidden="true" />
              Logowanie Google wkrótce
            </button>

            <div className="ff-auth-divider">lub e-mail</div>

            <form onSubmit={handleSubmit} className="ff-auth-form" noValidate>
              <div className={errors.email ? 'ff-auth-field ff-auth-field-error' : 'ff-auth-field'}>
                <label className="ff-label" htmlFor="email">E-mail</label>
                <div className="ff-auth-input-wrap">
                  <span className="ff-auth-input-lead" aria-hidden="true">
                    <Mail size={16} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    className="ff-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="twoj@sklep.pl"
                  />
                </div>
                {errors.email && <p className="ff-auth-error-text">{errors.email}</p>}
              </div>

              <div className={errors.password ? 'ff-auth-field ff-auth-field-error' : 'ff-auth-field'}>
                <label className="ff-label" htmlFor="password">Hasło</label>
                <div className="ff-auth-input-wrap">
                  <span className="ff-auth-input-lead" aria-hidden="true">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="ff-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Wpisz hasło"
                  />
                  <button
                    type="button"
                    className="ff-auth-password-toggle ff-focus-ring"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="ff-auth-error-text">{errors.password}</p>}
              </div>

              <button type="submit" className="ff-btn-primary ff-auth-submit" disabled={submitting}>
                {submitting ? 'Logowanie...' : 'Zaloguj się'}
                {!submitting && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="ff-auth-alt-link">
              Nie masz konta? <Link to="/register">Zarejestruj się</Link>
            </p>

            <p className="ff-auth-legal-note">Logowanie zabezpieczone. Dane przetwarzamy zgodnie z RODO.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
