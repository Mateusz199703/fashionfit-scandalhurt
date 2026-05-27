import React from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-black/15 bg-[#f7f7f7] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-3xl leading-none text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink/45 hover:bg-black/5" aria-label="Zamknij">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
