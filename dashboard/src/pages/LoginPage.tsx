import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Shirt, Eye, EyeOff } from 'lucide-react';
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
          <div className="ff-auth-brand">
            <span className="ff-auth-mark">
              <Shirt size={16} />
            </span>
            <span>FashionFit Studio</span>
          </div>

          <p className="ff-auth-kicker">B2B Virtual Try-On Platform</p>
          <h1 className="ff-auth-title">
            Moda zaczyna
            <br />
            się od
            <br />
            pierwszego wrażenia.
          </h1>
          <p className="ff-auth-copy">
            Twój panel do zarządzania przymierzalnią AI, konwersjami i doświadczeniem zakupowym klientów.
          </p>

          <div className="ff-auth-metrics">
            <div>
              <b>+27%</b>
              <span>średni wzrost konwersji</span>
            </div>
            <div>
              <b>-19%</b>
              <span>mniej zwrotów</span>
            </div>
            <div>
              <b>24/7</b>
              <span>analityka w czasie rzeczywistym</span>
            </div>
          </div>
        </aside>

        <section className="ff-auth-panel">
          <div className="mb-7">
            <p className="ff-auth-panel-kicker">Panel Klienta</p>
            <h2 className="ff-auth-panel-title">Witaj ponownie</h2>
            <p className="mt-2 text-sm text-ink/60">Zaloguj się i wróć do zarządzania sprzedażą.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="ff-label" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="ff-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="ff-label" htmlFor="password">Hasło</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="ff-input pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink/55 hover:bg-black/5 hover:text-ink"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
            <p className="text-xs text-ink/55">Dla bezpieczeństwa używaj hasła minimum 8 znaków.</p>
            <button type="submit" className="ff-btn-primary ff-auth-submit" disabled={submitting}>
              {submitting ? 'Logowanie...' : 'Zaloguj się'}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            Nie masz konta?{' '}
            <Link to="/register" className="font-semibold text-ink hover:opacity-70">Zarejestruj się</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
