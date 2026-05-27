import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shirt } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute left-4 top-6 text-xs uppercase tracking-[0.16em] text-ink/45">FashionFit Studio</div>
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
            <Shirt size={24} />
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight">Witaj ponownie</h1>
          <p className="mt-1 text-sm text-ink/60">Zaloguj się do panelu i zarządzaj przymierzalnią AI.</p>
        </div>

        <form onSubmit={handleSubmit} className="ff-card space-y-4 p-6 sm:p-7" noValidate>
          <div>
            <label className="ff-label" htmlFor="email">E-mail</label>
            <input id="email" type="email" className="ff-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="ff-label" htmlFor="password">Hasło</label>
            <input id="password" type="password" className="ff-input" value={password} onChange={(e) => setPassword(e.target.value)} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          <button type="submit" className="ff-btn-primary w-full" disabled={submitting}>
            {submitting ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink/60">
          Nie masz konta?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">Zarejestruj się</Link>
        </p>
      </div>
    </div>
  );
}
