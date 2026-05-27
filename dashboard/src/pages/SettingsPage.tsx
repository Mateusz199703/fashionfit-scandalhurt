import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Eye, EyeOff, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';
import { Card, PlanBadge, StatusBadge } from '../components/ui';

export function SettingsPage() {
  const { client, logout } = useAuth();
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!client) return null;

  const copyKey = async () => {
    if (!client.apiKey) return;
    await navigator.clipboard.writeText(client.apiKey);
    setCopied(true);
    toast.success('Klucz API skopiowany');
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = client.apiKey ? `${client.apiKey.slice(0, 6)}${'•'.repeat(20)}${client.apiKey.slice(-4)}` : '—';

  return (
    <div className="space-y-6">
      <section className="ff-hero-panel">
        <div>
          <p className="ff-kicker">Account Settings</p>
          <h1 className="ff-page-title">Ustawienia</h1>
          <p className="mt-2 text-sm text-ink/65">Dane konta i klucze integracyjne dla WordPress i widgetu.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className="space-y-4 p-5">
        <h2 className="ff-section-title">Konto</h2>
        <Field label="Imię i nazwisko" value={client.name} />
        <Field label="E-mail" value={client.email} />
        {client.companyName && <Field label="Firma" value={client.companyName} />}
        {client.companyNip && <Field label="NIP" value={client.companyNip} />}
        <div>
            <span className="ff-label">Plan</span>
            <div className="flex items-center gap-2">
              <PlanBadge plan={client.plan} />
              <StatusBadge status={client.status} />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="ff-section-title">Klucz API</h2>
          <p className="text-sm text-ink/60">Używany przez wtyczkę oraz widget do komunikacji z backendem FashionFit.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink">
              {revealed ? client.apiKey : maskedKey}
            </code>
            <button className="ff-btn-secondary" onClick={() => setRevealed((v) => !v)}>
              {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button className="ff-btn-secondary" onClick={copyKey}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </div>

          <div className="pt-4">
            <button
              className="ff-btn-secondary"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut size={15} /> Wyloguj
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="ff-label">{label}</span>
      <div className="text-sm text-ink">{value}</div>
    </div>
  );
}
