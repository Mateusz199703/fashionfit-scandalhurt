import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Shirt, Eye, EyeOff, CheckCircle2, Circle, Mail, Lock, User, Building2, Sparkles } from 'lucide-react';
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
  const [selectedPlan, setSelectedPlan] = useState<Plan | ''>(initialPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Podaj imię lub nazwę';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Podaj poprawny adres e-mail';
    if (form.password.length < 8) next.password = 'Hasło musi mieć co najmniej 8 znaków';
    const nipDigits = form.company_nip.replace(/\D/g, '');
    if (form.company_nip.trim() && nipDigits.length !== 10) next.company_nip = 'NIP musi mieć 10 cyfr';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const passwordChecks = [
    { label: 'Minimum 8 znaków', ok: form.password.length >= 8 },
    { label: 'Co najmniej 1 duża litera', ok: /[A-Z]/.test(form.password) },
    { label: 'Co najmniej 1 cyfra', ok: /\d/.test(form.password) },
    { label: 'Co najmniej 1 znak specjalny', ok: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const score = passwordChecks.filter((x) => x.ok).length;
  const scorePct = (score / passwordChecks.length) * 100;
  const scoreLabel = score <= 1 ? 'Słabe' : score <= 2 ? 'Średnie' : score === 3 ? 'Dobre' : 'Mocne';

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
            Stwórz
            <br />
            doświadczenie,
            <br />
            które sprzedaje.
          </h1>
          <p className="ff-auth-copy">
            Dołącz do platformy i uruchom wirtualną przymierzalnię, która podnosi konwersję i buduje przewagę marki.
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
              <b>14 dni</b>
              <span>trial bez karty</span>
            </div>
          </div>

          <div className="ff-auth-quote">
            <p>
              "Po wdrożeniu AI Stylist klienci częściej kończą zakupy całym lookiem, a nie pojedynczym produktem."
            </p>
            <div className="ff-auth-quote-byline">
              <span className="ff-auth-quote-avatar">MK</span>
              <span>
                <b>Maison K</b>
                fashion ecommerce · Kraków
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

          <div className="ff-auth-switch" role="tablist" aria-label="Tryb rejestracji">
            <Link to="/login" className="ff-auth-switch-item" role="tab" aria-selected="false">
              Logowanie
            </Link>
            <span className="ff-auth-switch-item ff-auth-switch-item-active" role="tab" aria-selected="true">
              Rejestracja
            </span>
          </div>

          <div className="mb-7">
            <p className="ff-auth-panel-kicker">Nowe Konto</p>
            <h2 className="ff-auth-panel-title">Załóż konto</h2>
            <p className="ff-auth-panel-copy">Uruchom panel i dodaj pierwszy sklep w kilka minut.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 ff-auth-form" noValidate>
            <div className={errors.name ? 'ff-auth-field ff-auth-field-error' : 'ff-auth-field'}>
              <label className="ff-label" htmlFor="name">Imię i nazwisko</label>
              <div className="ff-auth-input-wrap">
                <span className="ff-auth-input-lead" aria-hidden="true">
                  <User size={16} />
                </span>
                <input id="name" className="ff-input" value={form.name} onChange={set('name')} placeholder="Anna Nowak" />
              </div>
              {errors.name && <p className="ff-auth-error-text">{errors.name}</p>}
            </div>

            <div className="ff-auth-field">
              <label className="ff-label" htmlFor="company">Nazwa firmy (opcjonalnie)</label>
              <div className="ff-auth-input-wrap">
                <span className="ff-auth-input-lead" aria-hidden="true">
                  <Building2 size={16} />
                </span>
                <input id="company" className="ff-input" value={form.company_name} onChange={set('company_name')} placeholder="Atelier Nord" />
              </div>
            </div>

            <div className={errors.company_nip ? 'ff-auth-field ff-auth-field-error' : 'ff-auth-field'}>
              <label className="ff-label" htmlFor="nip">NIP firmy (opcjonalnie)</label>
              <div className="ff-auth-input-wrap">
                <span className="ff-auth-input-lead" aria-hidden="true">
                  <Building2 size={16} />
                </span>
                <input id="nip" className="ff-input" value={form.company_nip} onChange={set('company_nip')} placeholder="1234567890" />
              </div>
              {errors.company_nip && <p className="ff-auth-error-text">{errors.company_nip}</p>}
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
              <div className="relative ff-auth-input-wrap">
                <span className="ff-auth-input-lead" aria-hidden="true">
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="ff-input pr-11"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Ustaw hasło"
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
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-xs text-white/65">
                  <span>Siła hasła</span>
                  <span className="font-semibold text-white/90">{scoreLabel}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] transition-all" style={{ width: `${scorePct}%` }} />
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-1.5 text-xs">
                    {check.ok ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Circle size={13} className="text-white/35" />}
                    <span className={check.ok ? 'text-emerald-300' : 'text-white/55'}>{check.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="ff-label">Plan (opcjonalnie od razu z płatnością)</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(['STARTER', 'GROWTH', 'SCALE'] as Plan[]).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan((prev) => (prev === plan ? '' : plan))}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ff-focus-ring ${
                      selectedPlan === plan
                        ? 'border-[var(--accent)] bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] text-white shadow-[0_14px_30px_-20px_var(--glow)]'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-[var(--accent)] hover:text-white'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-white/55 leading-relaxed">
                Gdy wybierzesz plan, po rejestracji przejdziesz bezpośrednio do Stripe Checkout. Bez wyboru planu uruchamiamy trial.
              </p>
            </div>

            <button type="submit" className="ff-btn-primary ff-auth-submit" disabled={submitting}>
              {submitting ? 'Tworzenie konta...' : 'Zarejestruj się'}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="ff-auth-trust">
            <Sparkles size={13} />
            <span>14 dni trial bez karty. Możesz anulować w dowolnym momencie.</span>
          </div>

          <p className="ff-auth-alt-link">
            Masz już konto?{' '}
            <Link to="/login">Zaloguj się</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
