import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Shirt } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', company_name: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = 'Podaj imię lub nazwę';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Podaj poprawny adres e-mail';
    if (form.password.length < 8) next.password = 'Hasło musi mieć co najmniej 8 znaków';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        company_name: form.company_name || undefined,
      });
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
          <div className="ff-auth-brand">
            <span className="ff-auth-mark">
              <Shirt size={16} />
            </span>
            <span>FashionFit Studio</span>
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
              <b>14 dni</b>
              <span>trial bez karty</span>
            </div>
            <div>
              <b>5 min</b>
              <span>średni czas wdrożenia</span>
            </div>
            <div>
              <b>∞</b>
              <span>skalowalność dla wielu sklepów</span>
            </div>
          </div>
        </aside>

        <section className="ff-auth-panel">
          <div className="mb-7">
            <p className="ff-auth-panel-kicker">Nowe Konto</p>
            <h2 className="ff-auth-panel-title">Załóż konto</h2>
            <p className="mt-2 text-sm text-ink/60">Uruchom panel i dodaj pierwszy sklep w kilka minut.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="ff-label" htmlFor="name">Imię i nazwisko</label>
              <input id="name" className="ff-input" value={form.name} onChange={set('name')} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="ff-label" htmlFor="company">Nazwa firmy (opcjonalnie)</label>
              <input id="company" className="ff-input" value={form.company_name} onChange={set('company_name')} />
            </div>
            <div>
              <label className="ff-label" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="ff-input" value={form.email} onChange={set('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="ff-label" htmlFor="password">Hasło</label>
              <input id="password" type="password" className="ff-input" value={form.password} onChange={set('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
            <button type="submit" className="ff-btn-primary ff-auth-submit" disabled={submitting}>
              {submitting ? 'Tworzenie konta...' : 'Zarejestruj się'}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/60">
            Masz już konto?{' '}
            <Link to="/login" className="font-semibold text-ink hover:opacity-70">Zaloguj się</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
