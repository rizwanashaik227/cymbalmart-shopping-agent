import React, { useState, useEffect } from 'react';
import { X, Wand2, DollarSign, TrendingDown, Store, CheckCircle, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';
import { PartyPlan } from '../types';

interface BudgetOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: PartyPlan;
  onApplyOptimizedPlan?: (updated: PartyPlan) => void;
}

export const BudgetOptimizerModal: React.FC<BudgetOptimizerModalProps> = ({
  isOpen,
  onClose,
  plan,
  onApplyOptimizedPlan,
}) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState<
    { title: string; impact: string; detail: string }[]
  >([]);

  useEffect(() => {
    if (isOpen) {
      fetchOptimization();
    }
  }, [isOpen]);

  const fetchOptimization = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/budget-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Budget optimizer error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - High Density */}
        <div className="px-4 py-3 border-b border-indigo-900 flex items-center justify-between bg-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-indigo-950 shadow-xs">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white tracking-tight uppercase">
                AI Budget Optimizer
              </h2>
              <p className="text-[10px] text-indigo-200">
                High-impact wholesale strategies & smart party cost reductions
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
        <div className="p-4 sm:p-5 space-y-3 max-h-[75vh] overflow-y-auto bg-white">
          {loading ? (
            <div className="py-10 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs font-bold text-slate-600">
                Analyzing grocery categories & wholesale consolidation...
              </p>
            </div>
          ) : (
            <>
              {/* Executive Summary */}
              {summary && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-black text-emerald-900 tracking-wider block mb-0.5">
                    Agent Optimization Summary
                  </span>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    {summary}
                  </p>
                </div>
              )}

              {/* Recommendations */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Actionable Savings Strategies
                </span>

                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900">
                        {rec.title}
                      </h4>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {rec.impact}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rec.detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Party Hacks Checklist */}
              {plan?.tipsAndHacks && plan.tipsAndHacks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Host Cost & Time Saving Rules
                  </span>
                  <div className="space-y-1">
                    {plan.tipsAndHacks.map((hack, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-700 bg-white border border-slate-200 p-2 rounded-lg flex items-start gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{hack}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-black text-xs rounded-lg transition-all shadow-2xs"
            >
              Back to Shopping List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
