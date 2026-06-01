import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Shirt, Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
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
    <div className="ff-auth-shell">
      <div className="ff-auth-grid">
        <aside className="ff-auth-hero">
          <div className="ff-auth-grid-layer" />
          <div className="ff-auth-glow ff-auth-glow-a" />
          <div className="ff-auth-glow ff-auth-glow-b" />

          <div className="ff-auth-brand">
            <span className="ff-auth-mark">
              <Shirt size={16} />
            </span>
            <span>FashionFit AI Studio</span>
          </div>

          <div className="ff-auth-core-wrap" aria-hidden="true">
            <div className="ff-auth-core-ring" />
            <span className="ff-ai-core ff-auth-core" />
          </div>

          <p className="ff-auth-kicker">Luxury Commerce Intelligence</p>
          <h1 className="ff-auth-title">
            Twój sklep dostaje
            <br />
            osobistego
            <br />
            stylistę AI.
          </h1>
          <p className="ff-auth-copy">
            Zaloguj się do Studio i zarządzaj rozmowami, rekomendacjami oraz konwersją w czasie rzeczywistym.
          </p>

          <div className="ff-auth-metrics">
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

          <div className="ff-auth-quote">
            <p>
              "Wdrożenie zajęło 5 minut. Po miesiącu konwersja w kategorii sukienek wzrosła o jedną trzecią."
            </p>
            <div className="ff-auth-quote-byline">
              <span className="ff-auth-quote-avatar">AN</span>
              <span>
                <b>Atelier Nord</b>
                butik premium · Warszawa
              </span>
            </div>
          </div>
        </aside>

        <section className="ff-auth-panel">
          <div className="ff-auth-mobile-brand">
            <span className="ff-auth-mark">
              <Shirt size={16} />
            </span>
            <span>FashionFit AI</span>
          </div>

          <div className="ff-auth-switch" role="tablist" aria-label="Tryb logowania">
            <span className="ff-auth-switch-item ff-auth-switch-item-active" role="tab" aria-selected="true">
              Logowanie
            </span>
            <Link to="/register" className="ff-auth-switch-item" role="tab" aria-selected="false">
              Rejestracja
            </Link>
          </div>

          <div className="mb-7">
            <p className="ff-auth-panel-kicker">Panel Klienta</p>
            <h2 className="ff-auth-panel-title">Witaj ponownie</h2>
            <p className="ff-auth-panel-copy">Zaloguj się i wróć do zarządzania sprzedażą.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 ff-auth-form" noValidate>
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
              <div className="relative ff-auth-input-wrap">
                <span className="ff-auth-input-lead" aria-hidden="true">
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="ff-input pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Wpisz hasło"
                />
                <button
                  type="button"
                  className="ff-auth-password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="ff-auth-error-text">{errors.password}</p>}
            </div>

            <p className="ff-auth-hint">Dla bezpieczeństwa używaj hasła minimum 8 znaków.</p>
            <button type="submit" className="ff-btn-primary ff-auth-submit" disabled={submitting}>
              {submitting ? 'Logowanie...' : 'Zaloguj się'}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="ff-auth-trust">
            <Sparkles size={13} />
            <span>Twoje dane są bezpieczne. Logowanie zgodne z RODO.</span>
          </div>

          <p className="ff-auth-alt-link">
            Nie masz konta?{' '}
            <Link to="/register">Zarejestruj się</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
