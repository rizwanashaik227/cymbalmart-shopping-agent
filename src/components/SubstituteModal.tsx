import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, Check, Tag, Store, RefreshCw } from 'lucide-react';
import { ShoppingItem } from '../types';

interface SubstituteModalProps {
  item: ShoppingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplySubstitution: (originalItemId: string, replacement: Partial<ShoppingItem>) => void;
}

export const SubstituteModal: React.FC<SubstituteModalProps> = ({
  item,
  isOpen,
  onClose,
  onApplySubstitution,
}) => {
  const [substitutions, setSubstitutions] = useState<
    { name: string; diff: string; priceDelta: string; store: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customGoal, setCustomGoal] = useState('Save budget or easier bulk prep');

  useEffect(() => {
    if (isOpen && item) {
      fetchSubstitutions();
    }
  }, [isOpen, item]);

  const fetchSubstitutions = async () => {
    if (!item) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/smart-substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: item.name,
          category: item.category,
          currentPrice: item.estimatedPrice,
          dietaryGoal: customGoal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubstitutions(data.substitutions || []);
      }
    } catch (err) {
      console.error('Error fetching substitutions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - High Density */}
        <div className="px-4 py-3 border-b border-indigo-900 flex items-center justify-between bg-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-indigo-950 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white tracking-tight uppercase">
                AI Smart Swap & Alternatives
              </h3>
              <p className="text-[10px] text-indigo-200">
                Find cheaper bulk, allergen-friendly, or higher-quality options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-indigo-300 hover:text-white hover:bg-indigo-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3 bg-white">
          {/* Current Target Item */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 block">Current Item</span>
              <div className="text-xs font-black text-slate-900">{item.name}</div>
              <span className="text-[10px] text-slate-500 font-medium">
                {item.quantity} {item.unit} • {item.store}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-slate-900">
                ${item.estimatedPrice.toFixed(2)}
              </div>
              <span className="text-[9px] text-slate-400">Current cost</span>
            </div>
          </div>

          {/* Goal Selector */}
          <div className="flex gap-1.5">
            {[
              'Lower Cost / Bulk',
              'Vegan / Gluten-Free',
              'Less Prep / Ready-Made',
            ].map((goal) => (
              <button
                key={goal}
                onClick={() => {
                  setCustomGoal(goal);
                  fetchSubstitutions();
                }}
                className={`flex-1 py-1 text-[11px] font-black rounded-lg border transition-all ${
                  customGoal === goal
                    ? 'bg-indigo-950 border-indigo-950 text-white'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>

          {/* Suggestions List */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Suggested AI Alternatives
            </span>

            {isLoading ? (
              <div className="py-6 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs font-bold text-slate-600">Analyzing ingredients & store pricing...</p>
              </div>
            ) : substitutions.length === 0 ? (
              <div className="text-center py-5 text-xs text-slate-500 font-medium">
                No substitutions generated. Try another criteria.
              </div>
            ) : (
              substitutions.map((sub, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl p-3 transition-all flex items-center justify-between gap-2.5 shadow-2xs hover:shadow-xs group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {sub.name}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {sub.priceDelta}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{sub.diff}</p>
                    <span className="text-[10px] text-slate-500 font-bold mt-0.5 inline-block">
                      📍 Recommended: {sub.store}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onApplySubstitution(item.id, {
                        name: sub.name,
                        store: (sub.store as any) || item.store,
                        notes: sub.diff,
                      });
                      onClose();
                    }}
                    className="px-2.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-white font-black text-[11px] rounded-lg transition-all flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <span>Swap</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
