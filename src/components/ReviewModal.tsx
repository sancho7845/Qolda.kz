import React, { useState } from 'react';
import { X, Star, Heart } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  taskId: string;
  targetUserName: string;
  onClose: () => void;
  onSubmit: (rating: number, text: string) => Promise<void>;
}

export default function ReviewModal({ isOpen, taskId, targetUserName, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    await onSubmit(rating, text || 'Ешқандай жазба қалдырылмады. Рақмет!');
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-md">
      <div className="glass-modal w-full max-w-md rounded-3xl overflow-hidden text-sm animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-neutral-800/30">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <Heart className="w-5 h-5 fill-teal-600 dark:fill-teal-400 text-teal-600 animate-pulse" />
            <h3 className="font-bold text-base">Пікір қалдыру</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100/30 dark:hover:bg-neutral-800/30 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-neutral-500 dark:text-neutral-450 text-xs">
              Сізге қолұшын созған еріктіге баға беріп, жылы лебізіңізді білдіріңіз:
            </p>
            <div className="font-black text-neutral-800 dark:text-neutral-50 mt-1.5 text-base">
              {targetUserName}
            </div>
          </div>

          {/* Stars */}
          <div className="flex justify-center items-center gap-2.5 py-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = hoverRating !== null ? star <= hoverRating : star <= rating;
              return (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 text-2xl transition-transform hover:scale-125 duration-150 focus:outline-none cursor-pointer"
                >
                  <Star 
                    className={`w-8 h-8 ${
                      isActive 
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]' 
                        : 'text-neutral-200 dark:text-neutral-700/60'
                    }`} 
                  />
                </button>
              );
            })}
          </div>

          {/* Selection label */}
          <div className="text-center font-bold text-xs text-neutral-550 dark:text-neutral-400 p-2 bg-white/10 dark:bg-neutral-950/20 rounded-xl">
            {rating === 5 && 'Тамаша! Көмек жоғары деңгейде көрсетілді 😍'}
            {rating === 4 && 'Өте жақсы! Ризамын 😊'}
            {rating === 3 && 'Жақсы, көмек көрсетілді 👍'}
            {rating === 2 && 'Қанағаттанарлықсыз 😕'}
            {rating === 1 && 'Көмек көрсетілмеді немесе нашар болды 😡'}
          </div>

          {/* Feedback details */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Пікір немесе алғыс хатыңызды жазыңыз:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Көмек үшін алғысыңызды немесе ескертулеріңізді осында жаза аласыз..."
              maxLength={600}
              rows={4}
              className="w-full p-3.5 rounded-xl border border-white/20 dark:border-neutral-800/35 focus:border-teal-500 bg-transparent text-xs text-neutral-800 dark:text-neutral-100 outline-none glass-input placeholder:text-neutral-400"
            />
          </div>

          {/* Footer controls */}
          <div className="flex gap-2 justify-end pt-4 border-t border-white/20 dark:border-neutral-800/30 animate-in fade-in">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold rounded-xl border border-white/20 dark:border-neutral-700 hover:bg-white/10 dark:hover:bg-neutral-800/20 text-neutral-700 dark:text-neutral-200"
            >
              Кеййнге қалдыру
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-6 text-xs font-bold rounded-xl bg-teal-605 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white disabled:opacity-50 transition-all shadow-xs"
            >
              {submitting ? 'Жіберілуде...' : 'Пікір қосу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
