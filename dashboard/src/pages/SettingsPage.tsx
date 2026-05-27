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
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Ustawienia</h1>

      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Konto</h2>
        <Field label="Imię i nazwisko" value={client.name} />
        <Field label="E-mail" value={client.email} />
        {client.companyName && <Field label="Firma" value={client.companyName} />}
        <div>
          <span className="ff-label">Plan</span>
          <div className="flex items-center gap-2">
            <PlanBadge plan={client.plan} />
            <StatusBadge status={client.status} />
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">Klucz API</h2>
        <p className="text-sm text-gray-500">Używany przez wtyczkę i widget do komunikacji z FashionFit.</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-gray-100 px-3 py-2 text-sm">
            {revealed ? client.apiKey : maskedKey}
          </code>
          <button className="ff-btn-secondary" onClick={() => setRevealed((v) => !v)}>
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button className="ff-btn-secondary" onClick={copyKey}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </Card>

      <Card className="flex items-center justify-between p-5">
        <div>
          <h2 className="font-semibold">Wyloguj</h2>
          <p className="text-sm text-gray-500">Zakończ sesję w tej przeglądarce.</p>
        </div>
        <button
          className="ff-btn-secondary"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <LogOut size={15} /> Wyloguj
        </button>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="ff-label">{label}</span>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}
