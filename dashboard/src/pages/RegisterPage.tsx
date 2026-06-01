import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Shirt, Eye, EyeOff, Mail, Lock, Store, Sun, Moon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import { Plan } from '../types';

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

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Podaj imię lub nazwę';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Podaj poprawny adres e-mail';
    if (form.password.length < 8) next.password = 'Hasło musi mieć co najmniej 8 znaków';
    if (!termsAccepted) next.terms = 'Aby założyć konto, zaakceptuj regulamin i politykę prywatności.';
    const nipDigits = form.company_nip.replace(/\D/g, '');
    if (form.company_nip.trim() && nipDigits.length !== 10) next.company_nip = 'NIP musi mieć 10 cyfr';
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
        company_nip: form.company_nip || undefined,
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
              Dołącz do platformy i uruchom AI Stylist oraz Virtual Try-On w kilka minut.
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
              <p>"Po wdrożeniu AI Stylist klientki częściej kończą zakupy całym lookiem, a nie jednym produktem."</p>
              <div className="ff-auth-quote-byline">
                <span className="ff-auth-quote-avatar">MK</span>
                <span>
                  <b>Maison K</b>
                  fashion ecommerce · Kraków
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
