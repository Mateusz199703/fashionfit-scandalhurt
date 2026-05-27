import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shirt } from 'lucide-react';
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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute left-4 top-6 text-xs uppercase tracking-[0.16em] text-ink/45">FashionFit Studio</div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
            <Shirt size={24} />
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight">Załóż konto</h1>
          <p className="mt-1 text-sm text-ink/60">Uruchom panel i dodaj pierwszy sklep w kilka minut.</p>
        </div>

        <form onSubmit={handleSubmit} className="ff-card space-y-4 p-6 sm:p-7" noValidate>
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
          <button type="submit" className="ff-btn-primary w-full" disabled={submitting}>
            {submitting ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink/60">
          Masz już konto?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
}
