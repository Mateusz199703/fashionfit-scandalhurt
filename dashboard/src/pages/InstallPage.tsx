import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Copy, Check, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '../api/client';
import { Card } from '../components/ui';

const PLUGIN_URL = process.env.REACT_APP_PLUGIN_URL || 'https://cdn.fashionfit.app/fashionfit.zip';

export function InstallPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [snippet, setSnippet] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .get<{ snippet: string }>(`/api/shops/${id}/snippet`)
      .then((r) => setSnippet(r.data.snippet))
      .catch((err) => toast.error(apiErrorMessage(err)));
  }, [id]);

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success('Skopiowano');
    setTimeout(() => setCopied(false), 2000);
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const { data } = await api.get<{ connected: boolean }>(`/api/shops/${id}/verify`);
      setVerified(data.connected);
      if (data.connected) toast.success('Połączenie działa!');
      else toast('Nie wykryto jeszcze aktywności widgetu', { icon: '⏳' });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  const steps = [
    { n: 1, title: 'Pobierz fashionfit.zipwtyczkę' },
    { n: 2, title: 'Wklej snippet' },
    { n: 3, title: 'Zweryfikuj instalację' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="ff-hero-panel">
        <div>
          <p className="ff-kicker">Setup Wizard</p>
          <h1 className="ff-page-title">Instalacja widgetu</h1>
          <p className="mt-2 text-sm text-ink/65">3 kroki i sklep jest gotowy do zbierania konwersji z przymiarek.</p>
        </div>
      </section>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    step >= s.n ? 'bg-black text-white' : 'bg-black/10 text-black/50'
                  }`}
                >
                  {s.n}
                </div>
                <span className="mt-1 text-[11px] text-ink/55">{s.title}</span>
              </div>
              {i < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${step > s.n ? 'bg-black' : 'bg-black/15'}`} />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      {step === 1 && (
        <Card className="space-y-4 p-6">
          <h2 className="ff-section-title">1. Pobierz wtyczkę WordPress</h2>
          <p className="text-sm text-ink/60">
            Pobierz paczkę i zainstaluj ją w WordPress: Wtyczki, potem Dodaj nową i Wyślij wtyczkę.
          </p>
          <a className="ff-btn-primary w-fit" href={PLUGIN_URL} download>
            <Download size={16} /> Pobierz fashionfit.zip
          </a>
          <div className="pt-2">
            <button className="ff-btn-secondary" onClick={() => setStep(2)}>Dalej</button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4 p-6">
          <h2 className="ff-section-title">2. Wklej kod instalacyjny</h2>
          <p className="text-sm text-ink/60">
            Jeśli nie korzystasz z wtyczki, wklej kod ręcznie do motywu. Przy wtyczce ten krok jest automatyczny.
          </p>
          <pre className="overflow-x-auto rounded-xl bg-black p-4 text-xs text-gray-100">
            <code>{snippet}</code>
          </pre>
          <button className="ff-btn-secondary w-fit" onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Skopiowano' : 'Kopiuj kod'}
          </button>
          <div className="flex gap-2 pt-2">
            <button className="ff-btn-secondary" onClick={() => setStep(1)}>Wstecz</button>
            <button className="ff-btn-primary" onClick={() => setStep(3)}>Dalej</button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4 p-6">
          <h2 className="ff-section-title">3. Zweryfikuj instalację</h2>
          <p className="text-sm text-ink/60">
            Po instalacji sprawdź połączenie sklepu z backendem FashionFit.
          </p>

          {verified === true && (
            <div className="flex items-center gap-2 rounded-xl border border-black/15 bg-white p-3 text-sm text-ink">
              <CheckCircle2 size={18} /> Połączenie potwierdzone - wszystko działa.
            </div>
          )}
          {verified === false && (
            <div className="flex items-center gap-2 rounded-xl border border-black/15 bg-white p-3 text-sm text-ink/70">
              <XCircle size={18} /> Brak aktywności. Zsynchronizuj produkty i odwiedź stronę produktu.
            </div>
          )}

          <button className="ff-btn-primary w-fit" onClick={verify} disabled={verifying}>
            {verifying ? <Loader2 size={16} className="animate-spin" /> : null} Sprawdź połączenie
          </button>

          <div className="flex gap-2 pt-2">
            <button className="ff-btn-secondary" onClick={() => setStep(2)}>Wstecz</button>
            <button className="ff-btn-primary" onClick={() => navigate(`/shops/${id}`)}>Zakończ</button>
          </div>
        </Card>
      )}
    </div>
  );
}
