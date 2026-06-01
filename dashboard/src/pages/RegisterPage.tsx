import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Lock, Store, Sun, Moon, Hash } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import { Plan } from '../types';

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

function normalizeNip(value: string) {
  return value.replace(/[\s-]+/g, '').replace(/\D/g, '');
}

function isValidPolishNip(nip: string) {
  if (!/^\d{10}$/.test(nip)) return false;
  const digits = nip.split('').map(Number);
  const checksum = NIP_WEIGHTS.reduce((sum, weight, idx) => sum + (digits[idx] * weight), 0) % 11;
  return checksum !== 10 && checksum === digits[9];
}

function getPasswordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return { score, label: 'Słabe', segments: password.length ? 1 : 0 };
  if (score === 2) return { score, label: 'Średnie', segments: 2 };
  if (score <= 4) return { score, label: 'Dobre', segments: 3 };
  return { score, label: 'Mocne', segments: 4 };
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPlan = String(searchParams.get('plan') || '').toUpperCase();
  const initialPlan = ['STARTER', 'GROWTH', 'SCALE'].includes(queryPlan) ? (queryPlan as Plan) : '';
  const [form, setForm] = useState({ name: '', email: '', password: '', company_name: '', company_nip: '' });
  const [selectedPlan] = useState<Plan | ''>(initialPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const passwordStrength = getPasswordStrength(form.password);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setCompanyNip = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, company_nip: normalizeNip(e.target.value) }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Podaj imię lub nazwę';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Podaj poprawny adres e-mail';
    if (form.password.length < 8) next.password = 'Hasło musi mieć co najmniej 8 znaków';
    if (!termsAccepted) next.terms = 'Aby założyć konto, zaakceptuj regulamin i politykę prywatności.';
    const nipDigits = normalizeNip(form.company_nip);
    if (!nipDigits) next.company_nip = 'NIP firmy jest wymagany.';
    else if (!isValidPolishNip(nipDigits)) next.company_nip = 'Podaj poprawny NIP firmy.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { checkoutUrl } = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        company_name: form.company_name || undefined,
        company_nip: normalizeNip(form.company_nip) || undefined,
        plan: selectedPlan || undefined,
      });
      if (checkoutUrl) {
        toast.success('Konto utworzone, przekierowanie do płatności');
        window.location.href = checkoutUrl;
        return;
      }
      toast.success('Konto utworzone');
      navigate('/dashboard');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Rejestracja nie powiodła się'));
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
              <span className="ff-auth-mark" aria-hidden="true" />
              <span>
                FashionFit <b>AI</b>
              </span>
            </div>
          </div>

          <div className="ff-auth-hero-mid">
            <div className="ff-auth-core-wrap" aria-hidden="true">
              <div className="ff-auth-core-ring" />
              <div className="ff-auth-core-ring-solid" />
              <div className="ff-auth-core-frame" />
              <span className="ff-auth-core" />
            </div>
            <h1 className="ff-auth-title">
              Twój sklep dostaje
              <br />
              <span className="ff-auth-title-grad">osobistego stylistę AI.</span>
            </h1>
            <p className="ff-auth-copy">
              Zaloguj się do Studio i zobacz, jak FashionFit AI
              podnosi konwersję, dobiera rozmiary i buduje
              kompletne looki — w czasie rzeczywistym.
            </p>
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
            <span className="ff-auth-mark" aria-hidden="true" />
            <span>
              FashionFit <b>AI</b>
            </span>
          </div>

          <div className="ff-auth-form-wrap">
            <nav className="ff-auth-switch" aria-label="Nawigacja logowanie/rejestracja">
              <Link to="/login" className="ff-auth-switch-item">Logowanie</Link>
              <span className="ff-auth-switch-item ff-auth-switch-item-active">Rejestracja</span>
            </nav>

            <div className="ff-auth-heading">
              <h2 className="ff-auth-panel-title">Załóż konto za darmo</h2>
              <p className="ff-auth-panel-copy">14 dni Growth bez karty. Wdrożenie w 5 minut.</p>
            </div>

            <button type="button" className="ff-auth-sso-button ff-focus-ring" disabled aria-disabled="true">
              <span className="ff-auth-google-dot" aria-hidden="true" />
              Rejestracja Google wkrótce
            </button>

            <div className="ff-auth-divider">lub e-mail</div>

            <form onSubmit={handleSubmit} className="ff-auth-form" noValidate>
              <div className={errors.name ? 'ff-auth-field ff-auth-field-error' : 'ff-auth-field'}>
                <label className="ff-label" htmlFor="name">Nazwa sklepu / imię</label>
                <div className="ff-auth-input-wrap">
                  <span className="ff-auth-input-lead" aria-hidden="true">
                    <Store size={16} />
                  </span>
                  <input id="name" className="ff-input" value={form.name} onChange={set('name')} placeholder="Atelier Nord" />
                </div>
                {errors.name && <p className="ff-auth-error-text">{errors.name}</p>}
              </div>

              <div className={errors.company_nip ? 'ff-auth-field ff-auth-field-error' : 'ff-auth-field'}>
                <label className="ff-label" htmlFor="company_nip">NIP firmy</label>
                <div className="ff-auth-input-wrap">
                  <span className="ff-auth-input-lead" aria-hidden="true">
                    <Hash size={16} />
                  </span>
                  <input
                    id="company_nip"
                    inputMode="numeric"
                    autoComplete="off"
                    className="ff-input"
                    value={form.company_nip}
                    onChange={setCompanyNip}
                    placeholder="np. 1234567890"
                    aria-invalid={errors.company_nip ? 'true' : 'false'}
                    aria-describedby={errors.company_nip ? 'company-nip-error company-nip-help' : 'company-nip-help'}
                  />
                </div>
                <p id="company-nip-help" className="ff-auth-help-text">Podaj NIP firmy, dla której zakładasz konto.</p>
                {errors.company_nip && <p id="company-nip-error" className="ff-auth-error-text">{errors.company_nip}</p>}
              </div>

              <div className={errors.email ? 'ff-auth-field ff-auth-field-error' : 'ff-auth-field'}>
                <label className="ff-label" htmlFor="email">E-mail</label>
                <div className="ff-auth-input-wrap">
                  <span className="ff-auth-input-lead" aria-hidden="true">
                    <Mail size={16} />
                  </span>
                  <input id="email" type="email" className="ff-input" value={form.email} onChange={set('email')} placeholder="twoj@sklep.pl" />
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
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Ustaw hasło"
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
                <div className="ff-auth-password-strength" aria-live="polite">
                  <div className="ff-auth-password-strength-bars" aria-hidden="true">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <span
                        key={idx}
                        className={idx < passwordStrength.segments ? 'ff-auth-password-strength-bar is-active' : 'ff-auth-password-strength-bar'}
                      />
                    ))}
                  </div>
                  <p className="ff-auth-password-strength-label">
                    Siła hasła: <strong>{passwordStrength.label}</strong>
                  </p>
                  <p className="ff-auth-password-strength-help">Użyj min. 8 znaków, cyfry i wielkiej litery.</p>
                </div>
              </div>

              <label className="ff-auth-check-row">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  aria-describedby={errors.terms ? 'terms-error' : undefined}
                />
                <span>
                  Akceptuję regulamin i politykę prywatności.
                </span>
              </label>
              {errors.terms && <p id="terms-error" className="ff-auth-error-text">{errors.terms}</p>}

              <button type="submit" className="ff-btn-primary ff-auth-submit" disabled={submitting}>
                {submitting ? 'Tworzenie konta...' : 'Utwórz konto'}
                {!submitting && <ArrowRight size={16} />}
              </button>
            </form>

            <p className="ff-auth-alt-link">
              Masz już konto? <Link to="/login">Zaloguj się</Link>
            </p>

            <p className="ff-auth-legal-note">
              Rejestracja oznacza zgodę na kontakt produktowy i operacyjny.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
