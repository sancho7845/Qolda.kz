import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  targetType: 'user' | 'task';
  targetLabel: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export default function ReportModal({ isOpen, targetType, targetLabel, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState('Орынсыз мазмұн немесе спам');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const finalReason = reason === 'Басқа' ? (customReason || 'Түсіндірме берілмеген басқа себеп') : reason;
    await onSubmit(finalReason);
    setSubmitting(false);
    onClose();
  };

  const presetReasons = [
    'Орынсыз мазмұн немесе балағат сөздер',
    'Жалған ақпарат немесе алаяқтық күдігі',
    'Спам немесе тиісті емес жарнама',
    'Мұнда көмек емес, коммерциялық ұсыныс жазылған',
    'Қауіпті немесе заңсыз әрекеттер',
    'Басқа'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-md">
      <div className="glass-modal w-full max-w-md rounded-3xl overflow-hidden text-sm animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-neutral-800/30">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-450">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-base">Шағым түсіру</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100/30 dark:hover:bg-neutral-800/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-neutral-500 dark:text-neutral-450 text-xs leading-relaxed">
            Сіз белсенді қоғамдастық ережесін бұзған нысанға шағым жасап жатырсыз. Модераторлар бұл сұранысты тез арада тексереді.
          </p>

          <div className="p-3 bg-white/10 dark:bg-neutral-950/25 rounded-xl border border-white/20 dark:border-neutral-800/20 text-xs">
            <span className="text-neutral-400">Шағым нысаны ({targetType === 'user' ? 'Пайдаланушы' : 'Тапсырма'}):</span>
            <div className="font-bold text-neutral-800 dark:text-neutral-100 mt-1 truncate">{targetLabel}</div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Шағымның негізгі себебін таңдаңыз:
            </label>
            <div className="space-y-1.5">
              {presetReasons.map((preset) => (
                <label 
                  key={preset} 
                  className={`flex items-center gap-2.5 p-2.5 px-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    reason === preset 
                      ? 'border-rose-400 bg-rose-50/40 text-rose-800 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-300 shadow-xs' 
                      : 'border-white/10 hover:bg-white/15 dark:border-neutral-800/30 dark:hover:bg-neutral-850/30 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={preset}
                    checked={reason === preset}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-rose-605 cursor-pointer"
                  />
                  <span>{preset}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === 'Басқа' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Талапты толық сипаттаңыз:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Мұнда себебін толық жазыңыз..."
                required
                maxLength={400}
                rows={3}
                className="w-full p-3 rounded-xl border border-white/20 dark:border-neutral-850/35 focus:border-rose-500 bg-transparent text-xs text-neutral-800 dark:text-neutral-100 outline-none glass-input"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t border-white/20 dark:border-neutral-800/30 animate-in fade-in">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-white/20 dark:border-neutral-700 hover:bg-white/10 dark:hover:bg-neutral-800/20 text-neutral-700 dark:text-neutral-200"
            >
              Бас тарту
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              {submitting ? 'Жіберілуде...' : 'Шағым түсіру'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
