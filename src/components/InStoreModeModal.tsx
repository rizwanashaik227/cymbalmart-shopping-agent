import React, { useState } from 'react';
import { X, Check, Smartphone, Store, Sparkles, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ShoppingItem, PartyPlan, StoreType } from '../types';

interface InStoreModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
  onTogglePurchased: (id: string) => void;
}

export const InStoreModeModal: React.FC<InStoreModeModalProps> = ({
  isOpen,
  onClose,
  plan,
  onTogglePurchased,
}) => {
  // Extract unique stores
  const storeNames = Array.from(new Set(plan.shoppingList.map((i) => i.store)));
  const [currentStore, setCurrentStore] = useState<string>(storeNames[0] || 'Costco / Wholesale');

  if (!isOpen) return null;

  const currentStoreItems = plan.shoppingList.filter((i) => i.store === currentStore);
  const remainingInStore = currentStoreItems.filter((i) => !i.purchased).length;
  const totalRemaining = plan.shoppingList.filter((i) => !i.purchased).length;

  const handleToggle = (item: ShoppingItem) => {
    onTogglePurchased(item.id);
    if (!item.purchased) {
      confetti({
        particleCount: 30,
        spread: 45,
        origin: { y: 0.8 },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-indigo-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-150">
      {/* Top Mobile Bar */}
      <div className="px-3.5 py-2.5 bg-indigo-900 border-b border-indigo-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <div>
            <h2 className="text-xs sm:text-sm font-black text-white tracking-tight">
              In-Store Shopping Mode
            </h2>
            <p className="text-[10px] text-indigo-300">
              {totalRemaining} total items remaining across all stores
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 border border-indigo-700"
        >
          <span>Exit Mode</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Store Navigation Carousel */}
      <div className="bg-indigo-950 px-3 py-1.5 border-b border-indigo-800 overflow-x-auto flex gap-1.5 shrink-0">
        {storeNames.map((s) => {
          const itemsInThisStore = plan.shoppingList.filter((i) => i.store === s);
          const doneCount = itemsInThisStore.filter((i) => i.purchased).length;
          const isDone = doneCount === itemsInThisStore.length;
          const isSelected = currentStore === s;

          return (
            <button
              key={s}
              onClick={() => setCurrentStore(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-emerald-500 text-indigo-950 border-emerald-400 shadow-xs'
                  : isDone
                  ? 'bg-indigo-900 text-emerald-400 border-indigo-800'
                  : 'bg-indigo-900/80 text-indigo-200 border-indigo-800'
              }`}
            >
              <span>{s}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-indigo-950 text-emerald-400 font-black' : 'bg-indigo-800 text-indigo-300'
              }`}>
                {doneCount}/{itemsInThisStore.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Store Progress & Title */}
      <div className="px-3.5 py-2 bg-indigo-900/40 flex items-center justify-between border-b border-indigo-800">
        <div className="flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-black text-indigo-100">{currentStore}</span>
        </div>
        <span className="text-[11px] font-bold text-emerald-400">
          {remainingInStore === 0 ? '✓ Store Complete!' : `${remainingInStore} items left to grab`}
        </span>
      </div>

      {/* Items List for Selected Store - High Density Rows */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1.5">
        {currentStoreItems.length === 0 ? (
          <div className="text-center py-10 text-indigo-400 text-xs">
            No items assigned to this store.
          </div>
        ) : (
          currentStoreItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggle(item)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                item.purchased
                  ? 'bg-indigo-900/40 border-indigo-800/80 text-indigo-400 opacity-60'
                  : 'bg-indigo-900 border-indigo-800 hover:border-emerald-500/80 text-white shadow-2xs'
              }`}
            >
              {/* Big Touch Checkbox */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all ${
                    item.purchased
                      ? 'bg-emerald-500 text-indigo-950'
                      : 'border border-indigo-700 bg-indigo-800'
                  }`}
                >
                  {item.purchased && <Check className="w-4 h-4 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm font-black tracking-tight ${
                        item.purchased ? 'line-through text-indigo-400' : 'text-white'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-indigo-300 font-medium">
                    <span className="bg-indigo-800 px-1.5 py-0.2 rounded font-bold text-white">
                      Qty: {item.quantity} {item.unit}
                    </span>
                    {item.notes && (
                      <span className="text-amber-300 font-medium truncate max-w-[200px]">
                        ★ {item.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm font-black text-emerald-400">
                  ${item.estimatedPrice.toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Store Switcher */}
      <div className="p-3 bg-indigo-900 border-t border-indigo-800 flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-indigo-950 font-black text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>Done Shopping at {currentStore}</span>
        </button>
      </div>
    </div>
  );
};
