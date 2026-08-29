import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  PlusCircle,
  Calculator,
  CalendarCheck,
  UtensilsCrossed,
  Smartphone,
  CheckCircle2,
  SlidersHorizontal,
  Zap,
  Mic,
} from 'lucide-react';
import { PartyPlan } from '../types';

interface NavbarProps {
  currentPlan: PartyPlan;
  onOpenNewPlan: () => void;
  onOpenCalculator: () => void;
  onOpenInStoreMode: () => void;
  onOpenRecipe: () => void;
  onOpenRefineCheckout: () => void;
  onSelectPreset: (planId: string) => void;
  activeTab: 'shopping' | 'timeline' | 'budget';
  setActiveTab: (tab: 'shopping' | 'timeline' | 'budget') => void;
  onOpenChat: () => void;
  chatUnreadCount: number;
  onToggleVoice: () => void;
  isVoiceActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPlan,
  onOpenNewPlan,
  onOpenCalculator,
  onOpenInStoreMode,
  onOpenRecipe,
  onOpenRefineCheckout,
  onSelectPreset,
  activeTab,
  setActiveTab,
  onOpenChat,
  onToggleVoice,
  isVoiceActive,
}) => {
  const totalItems = currentPlan.shoppingList.length;
  const purchasedItems = currentPlan.shoppingList.filter((i) => i.purchased).length;
  const totalEstimatedCost = currentPlan.shoppingList.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const totalSpent = currentPlan.shoppingList
    .filter((i) => i.purchased)
    .reduce((sum, item) => sum + (item.actualPrice ?? item.estimatedPrice), 0);

  const isOverBudget = totalEstimatedCost > currentPlan.budget.target;

  return (
    <header className="sticky top-0 z-40 bg-indigo-950 text-white border-b border-indigo-800 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Active Plan Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-xs text-indigo-950 shrink-0 font-black text-sm">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  CymbalMart
                </span>
                <span className="text-indigo-400 text-[10px] font-medium">•</span>
                <span className="text-[10px] text-indigo-200 font-semibold">
                  Party Planner Shopping Agent
                </span>
              </div>
              <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight line-clamp-1 mt-0.5">
                {currentPlan?.title || 'CymbalMart Party Plan'}
              </h1>
            </div>
          </div>

          {/* CUJ Step Progress Navigation Bar */}
          <nav className="hidden lg:flex items-center gap-1 bg-indigo-900/80 p-1 rounded-lg border border-indigo-800/80">
            {/* Step 1: Define Event */}
            <button
              id="cuj-step-1-define"
              onClick={onOpenNewPlan}
              title="Step 1: Define Event (Party type, theme, budget, guests, requests)"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-indigo-200 hover:text-white hover:bg-indigo-800/60 transition-all"
            >
              <span className="w-4 h-4 rounded-full bg-indigo-700 text-white text-[10px] flex items-center justify-center font-black">
                1
              </span>
              <span>Define Event</span>
            </button>

            {/* Step 2: Review List */}
            <button
              id="cuj-step-2-review"
              onClick={() => setActiveTab('shopping')}
              title="Step 2: Review List & Align with Budget"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                activeTab === 'shopping'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-indigo-200 hover:text-white hover:bg-indigo-800/60'
              }`}
            >
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                activeTab === 'shopping' ? 'bg-indigo-950 text-white' : 'bg-indigo-700 text-white'
              }`}>
                2
              </span>
              <span>Review List</span>
              <span
                className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isOverBudget ? 'bg-amber-400 text-indigo-950' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                ${totalEstimatedCost.toFixed(0)} / ${currentPlan.budget.target}
              </span>
            </button>

            {/* Step 3: Refine & Checkout */}
            <button
              id="cuj-step-3-checkout"
              onClick={onOpenRefineCheckout}
              title="Step 3: Refine Constraints & Finalize Checkout"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all shadow-xs"
            >
              <span className="w-4 h-4 rounded-full bg-white text-emerald-950 text-[10px] flex items-center justify-center font-black">
                3
              </span>
              <span>Refine & Checkout</span>
              <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
            </button>

            {/* Timeline Tab */}
            <button
              id="tab-timeline-prep"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-indigo-200 hover:text-white hover:bg-indigo-800/60'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </nav>

          {/* Right Controls & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Party Math */}
            <button
              id="btn-nav-party-math"
              onClick={onOpenCalculator}
              title="Party Drink & Food Quantity Calculator Formulas"
              className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold text-indigo-200 hover:text-white hover:bg-indigo-900 rounded-lg transition-all"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Party Math</span>
            </button>

            {/* Recipe / Punch */}
            {currentPlan.signatureRecipe && (
              <button
                id="btn-nav-recipe"
                onClick={onOpenRecipe}
                title="Signature Party Batch Drink & Food Recipe"
                className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold text-indigo-200 hover:text-white hover:bg-indigo-900 rounded-lg transition-all"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Signature Punch</span>
              </button>
            )}

            {/* Hands-Free Voice Control Trigger Button */}
            <button
              id="btn-nav-voice-control"
              onClick={onToggleVoice}
              title="Activate Hands-Free Voice Control (Press 'V' or click)"
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all shadow-md border ${
                isVoiceActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/50 animate-pulse'
                  : 'bg-indigo-900/90 hover:bg-indigo-800 text-emerald-300 hover:text-white border-indigo-700/80'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${isVoiceActive ? 'text-slate-950 animate-bounce' : 'text-emerald-400'}`} />
              <span>Voice</span>
              <span className="hidden md:inline text-[9px] px-1 py-0.2 rounded bg-indigo-950/80 text-emerald-200 font-extrabold border border-indigo-700">
                V
              </span>
              {isVoiceActive && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>

            {/* In-Store Mode Button */}
            <button
              id="btn-open-instore-mode"
              onClick={onOpenInStoreMode}
              title="Open Mobile-Optimized CymbalMart In-Store Shopping Mode"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all shadow-xs border border-slate-700"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">In-Store</span>
            </button>

            {/* CymbalMart Assistant Chatbot Button */}
            <button
              id="btn-open-cymbalmart-assistant"
              onClick={onOpenChat}
              title="Open CymbalMart Assistant Chatbot"
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-xs border border-emerald-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-950" />
              <span className="font-extrabold">CymbalMart Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping absolute -top-0.5 -right-0.5" />
            </button>

            {/* Step 3 Mobile Quick Checkout button */}
            <button
              id="btn-quick-checkout-mobile"
              onClick={onOpenRefineCheckout}
              className="flex lg:hidden items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Checkout</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden items-center justify-around py-1.5 border-t border-indigo-900 text-xs font-bold text-indigo-200">
          <button
            onClick={onToggleVoice}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${
              isVoiceActive ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice</span>
          </button>
          <button
            onClick={onOpenNewPlan}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-indigo-200 hover:text-white"
          >
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-700 text-white text-[9px] flex items-center justify-center font-black">
              1
            </span>
            <span>Define</span>
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              activeTab === 'shopping' ? 'bg-white text-indigo-950' : ''
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Review List ({purchasedItems}/{totalItems})</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
              activeTab === 'timeline' ? 'bg-white text-indigo-950' : ''
            }`}
          >
            <CalendarCheck className="w-3 h-3" />
            <span>Timeline</span>
          </button>
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-indigo-200 hover:text-white"
          >
            <Calculator className="w-3 h-3 text-amber-400" />
            <span>Math</span>
          </button>
        </div>
      </div>
    </header>
  );
};
