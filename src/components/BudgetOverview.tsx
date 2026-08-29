import React, { useState } from 'react';
import {
  DollarSign,
  TrendingDown,
  Store,
  AlertCircle,
  CheckCircle2,
  Wand2,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  Zap,
  PieChart,
  Edit2,
  Check,
} from 'lucide-react';
import { PartyPlan, StoreType, ShoppingItem, BrandType, ItemCategory } from '../types';

interface BudgetOverviewProps {
  plan: PartyPlan;
  onOpenOptimizer: () => void;
  onApplyPlanUpdate: (updatedPlan: PartyPlan) => void;
  selectedStore: string;
  onSelectStore: (store: string) => void;
}

const CATEGORY_NAMES: Record<ItemCategory, string> = {
  food: 'Food & Catering',
  drinks: 'Drinks & Bar',
  decor: 'Decor & Ambience',
  tableware: 'Tableware & Paper',
  ice_utility: 'Ice & Essentials',
  activities: 'Games & Activities',
  favors: 'Party Favors',
};

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  plan,
  onOpenOptimizer,
  onApplyPlanUpdate,
  selectedStore,
  onSelectStore,
}) => {
  const targetBudget = plan?.budget?.target || 350;
  const budgetTier = plan?.budget?.tier || 'balanced';
  const shoppingList = plan?.shoppingList || [];
  const totalEstimated = shoppingList.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
  const totalSpent = shoppingList
    .filter((i) => i.purchased)
    .reduce((sum, i) => sum + (i.actualPrice ?? i.estimatedPrice), 0);

  const remaining = targetBudget - totalSpent;
  const isOverBudget = totalEstimated > targetBudget;
  const overBudgetAmount = totalEstimated - targetBudget;

  const [alignMessage, setAlignMessage] = useState<string | null>(null);
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);

  // Target Budget editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInputVal, setBudgetInputVal] = useState(targetBudget.toString());

  const handleSaveBudgetLimit = () => {
    const val = parseFloat(budgetInputVal);
    if (!isNaN(val) && val > 0) {
      onApplyPlanUpdate({
        ...plan,
        budget: {
          ...plan.budget,
          target: Math.round(val),
        },
      });
    }
    setIsEditingBudget(false);
  };

  // 1-Click Auto-Align Items with Total Budget
  const handleAutoAlignWithBudget = () => {
    let currentTotal = totalEstimated;
    let list: ShoppingItem[] = JSON.parse(JSON.stringify(plan.shoppingList));

    // Step 1: Switch items to Cymbal Choice store brands (-22%)
    for (let i = 0; i < list.length; i++) {
      if (currentTotal <= targetBudget) break;
      if (list[i].brand !== 'Cymbal Choice') {
        const oldPrice = list[i].estimatedPrice;
        const newPrice = Math.round(oldPrice * 0.78 * 100) / 100;
        list[i].brand = 'Cymbal Choice' as BrandType;
        list[i].estimatedPrice = newPrice;
        list[i].cymbalSavings = (list[i].cymbalSavings || 0) + (oldPrice - newPrice);
        currentTotal -= oldPrice - newPrice;
      }
    }

    // Step 2: Trim optional items if still over
    if (currentTotal > targetBudget) {
      list = list.map((item) => {
        if (currentTotal > targetBudget && item.priority === 'optional') {
          const oldPrice = item.estimatedPrice;
          const newQty = Math.max(1, Math.floor(item.quantity * 0.6));
          const newPrice = Math.round((oldPrice / (item.quantity || 1)) * newQty * 100) / 100;
          currentTotal -= oldPrice - newPrice;
          return { ...item, quantity: newQty, estimatedPrice: newPrice };
        }
        return item;
      });
    }

    // Step 3: Trim nice_to_have non-food/decor if still slightly over
    if (currentTotal > targetBudget) {
      list = list.map((item) => {
        if (
          currentTotal > targetBudget &&
          (item.category === 'decor' || item.category === 'favors') &&
          item.priority === 'nice_to_have'
        ) {
          const oldPrice = item.estimatedPrice;
          const newPrice = Math.round(oldPrice * 0.7 * 100) / 100;
          currentTotal -= oldPrice - newPrice;
          return { ...item, estimatedPrice: newPrice };
        }
        return item;
      });
    }

    onApplyPlanUpdate({
      ...plan,
      shoppingList: list,
    });

    setAlignMessage(
      `✓ List successfully aligned! Total adjusted to $${currentTotal.toFixed(2)} (Target: $${targetBudget})`
    );
    setTimeout(() => setAlignMessage(null), 4000);
  };

  // Group by departments / stores
  const storeMap = new Map<string, { count: number; cost: number; purchasedCount: number }>();
  shoppingList.forEach((item) => {
    const current = storeMap.get(item.store) || { count: 0, cost: 0, purchasedCount: 0 };
    current.count += 1;
    current.cost += item.estimatedPrice;
    if (item.purchased) current.purchasedCount += 1;
    storeMap.set(item.store, current);
  });

  const stores = Array.from(storeMap.entries());

  // Category breakdown calculation
  const categoryMap = new Map<ItemCategory, { count: number; cost: number }>();
  shoppingList.forEach((item) => {
    const cur = categoryMap.get(item.category) || { count: 0, cost: 0 };
    cur.count += 1;
    cur.cost += item.estimatedPrice;
    categoryMap.set(item.category, cur);
  });

  const categoryEntries = Array.from(categoryMap.entries()).sort((a, b) => b[1].cost - a[1].cost);

  // Cymbal Choice Savings calculation
  const totalCymbalSavings = shoppingList.reduce((sum, i) => {
    if (i.brand === 'Cymbal Choice') {
      return sum + (i.cymbalSavings || (i.estimatedPrice / 0.78) * 0.22);
    }
    return sum + (i.cymbalSavings || 0);
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs mb-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              CUJ Step 2 • Live Budget Overview & Auto-Alignment
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-black tracking-wide ${
                budgetTier === 'thrifty'
                  ? 'bg-emerald-100 text-emerald-800'
                  : budgetTier === 'premium'
                  ? 'bg-purple-100 text-purple-800'
                  : budgetTier === 'luxury'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {(budgetTier || 'balanced').toUpperCase()} TIER
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              -${totalCymbalSavings.toFixed(0)} Cymbal Savings
            </span>
          </div>
          <p className="text-slate-600 text-xs mt-0.5 font-medium line-clamp-1">
            {plan?.vibeDescription || 'Party Plan'}
          </p>
        </div>

        {/* Action Buttons: Auto-Align with Budget & AI Optimizer */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
            title="Toggle category cost distribution"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Category Split</span>
          </button>

          {isOverBudget && (
            <button
              id="btn-auto-align-budget"
              onClick={handleAutoAlignWithBudget}
              title="Automatically align items with total budget by switching to Cymbal Choice brand and balancing quantities"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-xs shrink-0 animate-pulse"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Align to ${targetBudget}</span>
            </button>
          )}

          <button
            id="btn-open-budget-optimizer"
            onClick={onOpenOptimizer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-all shadow-xs shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Budget Optimizer</span>
          </button>
        </div>
      </div>

      {alignMessage && (
        <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{alignMessage}</span>
        </div>
      )}

      {/* High Density Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
        {/* Target Budget Card with Inline Edit */}
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Target Budget
            </span>
            <button
              onClick={() => {
                setIsEditingBudget(!isEditingBudget);
                setBudgetInputVal(targetBudget.toString());
              }}
              className="text-slate-400 hover:text-indigo-600"
              title="Edit Target Budget"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>

          {isEditingBudget ? (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-black text-slate-500">$</span>
              <input
                type="number"
                value={budgetInputVal}
                onChange={(e) => setBudgetInputVal(e.target.value)}
                className="w-20 px-1.5 py-0.5 bg-white border border-indigo-500 rounded text-xs font-black text-slate-900 outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveBudgetLimit}
                className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              ${targetBudget.toFixed(0)}
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-medium">Host Spending Limit</span>
        </div>

        {/* Estimated Total Card */}
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Est. Total
          </span>
          <div
            className={`text-base sm:text-lg font-black mt-0.5 ${
              isOverBudget ? 'text-amber-600' : 'text-emerald-700'
            }`}
          >
            ${totalEstimated.toFixed(2)}
          </div>
          <span className="text-[10px] font-medium text-slate-600">
            {!isOverBudget
              ? '✓ Aligned with budget'
              : `+$${overBudgetAmount.toFixed(2)} over target`}
          </span>
        </div>

        {/* Actual Spent Card */}
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Actual Spent
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
            ${totalSpent.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold">
            {plan.shoppingList.filter((i) => i.purchased).length} of {plan.shoppingList.length} items checked
          </span>
        </div>

        {/* Remaining Budget Card */}
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Remaining
          </span>
          <div
            className={`text-base sm:text-lg font-black mt-0.5 ${
              remaining >= 0 ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            ${Math.max(0, remaining).toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Available to Spend</span>
        </div>
      </div>

      {/* Optional Category Breakdown Drawer */}
      {showCategoryBreakdown && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-150">
          <div className="text-xs font-black uppercase text-slate-700 mb-2 flex items-center justify-between">
            <span>Category Spending Breakdown (Auto-Recalculating)</span>
            <span className="text-[10px] font-bold text-slate-500">
              Total: ${totalEstimated.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categoryEntries.map(([cat, data]) => {
              const percent = totalEstimated > 0 ? Math.round((data.cost / totalEstimated) * 100) : 0;
              return (
                <div key={cat} className="bg-white p-2 rounded-lg border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                    <span className="truncate">{CATEGORY_NAMES[cat] || cat}</span>
                    <span>${data.cost.toFixed(0)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>{data.count} items</span>
                    <span>{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* High Density Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
          <span>Shopping Progress: {Math.round((totalSpent / (totalEstimated || 1)) * 100)}% Spent</span>
          <span>
            {plan.shoppingList.filter((i) => i.purchased).length} of {plan.shoppingList.length} items purchased
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.round((totalSpent / (totalEstimated || 1)) * 100))}%`,
            }}
          />
        </div>
      </div>

      {/* CymbalMart Department / Store Filter Pills - High Density */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Store className="w-3 h-3 text-slate-400" />
            CymbalMart Department Aisles ({stores.length} Sections)
          </span>
          {selectedStore !== 'all' && (
            <button
              onClick={() => onSelectStore('all')}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            id="store-filter-all"
            onClick={() => onSelectStore('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
              selectedStore === 'all'
                ? 'bg-indigo-950 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Aisles ({plan.shoppingList.length})
          </button>

          {stores.map(([storeName, data]) => {
            const isSelected = selectedStore === storeName;
            const isDone = data.purchasedCount === data.count;
            return (
              <button
                key={storeName}
                id={`store-filter-${storeName.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => onSelectStore(isSelected ? 'all' : storeName)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{storeName}</span>
                <span
                  className={`px-1 py-0.1 rounded text-[10px] font-extrabold ${
                    isSelected ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {data.purchasedCount}/{data.count}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  ${data.cost.toFixed(0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
