import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, Send, ThumbsUp, X } from 'lucide-react';

interface QuoteFeedbackModalProps {
  isOpen: boolean;
  quoteId: string;
  onClose: () => void;
}

export const QuoteFeedbackModal: React.FC<QuoteFeedbackModalProps> = ({
  isOpen,
  quoteId,
  onClose,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [comments, setComments] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const aspectsList = [
    'Tariff Accuracy',
    'Calculation Speed',
    'Route Options',
    'Transparent Surcharges',
    'Ease of Container Spec',
    'Competitive Rates',
  ];

  const toggleAspect = (aspect: string) => {
    if (selectedAspects.includes(aspect)) {
      setSelectedAspects(selectedAspects.filter((a) => a !== aspect));
    } else {
      setSelectedAspects([...selectedAspects, aspect]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          rating,
          selectedAspects,
          comments,
        }),
      });
    } catch (err) {
      console.warn('Feedback submission fallback:', err);
    }

    setTimeout(() => {
      // Auto close after 1.8 seconds on success
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-800 overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Top Control Header */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide">
                  Quotation Feedback
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-extrabold uppercase border border-slate-700">
                  Optional
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                How was your experience for Quote <span className="text-cyan-400 font-bold">{quoteId}</span>?
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Skip & Close (Optional)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {isSubmitted ? (
            <div className="py-6 text-center space-y-3 animate-in fade-in zoom-in duration-200">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-white">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Your review for quotation <span className="text-cyan-400 font-bold">{quoteId}</span> has been saved. We appreciate your input to help improve FreightHub.
              </p>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/20 pt-1">
                <ThumbsUp className="w-4 h-4" />
                <span>Response Saved</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                  1. Rate your calculation accuracy (1 - 5 Stars):
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            active
                              ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                              : 'text-slate-700 hover:text-slate-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                  {rating > 0 && (
                    <span className="ml-2 text-xs font-bold text-amber-400">
                      {rating === 1 && 'Needs Work'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent Freight Rate!'}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Tags */}
              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                  2. What did you like about this estimate?
                </label>
                <div className="flex flex-wrap gap-2">
                  {aspectsList.map((aspect) => {
                    const isSelected = selectedAspects.includes(aspect);
                    return (
                      <button
                        key={aspect}
                        type="button"
                        onClick={() => toggleAspect(aspect)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        {aspect}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">
                  3. Additional Comments or Corridor Suggestions:
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Tell us what you think or suggest new trade lanes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions: Submit & Skip */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-bold text-slate-400 hover:text-white transition-colors px-2 py-1"
                >
                  Skip for now
                </button>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30 hover:scale-[1.02]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Feedback</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
