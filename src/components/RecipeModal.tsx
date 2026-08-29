import React, { useState } from 'react';
import { X, UtensilsCrossed, Wine, Plus, Check, Sparkles, GlassWater } from 'lucide-react';
import { SignatureRecipe, ShoppingItem } from '../types';

interface RecipeModalProps {
  recipe?: SignatureRecipe;
  isOpen: boolean;
  onClose: () => void;
  onAddIngredientsToShoppingList?: (ingredients: Partial<ShoppingItem>[]) => void;
  onAddIngredients?: (ingredients: Partial<ShoppingItem>[]) => void;
  guestCount?: number;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onAddIngredientsToShoppingList,
  onAddIngredients,
}) => {
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [addedNotification, setAddedNotification] = useState(false);

  if (!isOpen || !recipe) return null;

  const handleAddAllToShoppingList = () => {
    const items: Partial<ShoppingItem>[] = recipe.ingredients.map((ing, idx) => ({
      name: ing,
      category: recipe.type === 'cocktail' || recipe.type === 'punch' || recipe.type === 'mocktail' ? 'drinks' : 'food',
      store: 'Grocery / Supermarket',
      quantity: 1 * servingsMultiplier,
      unit: 'pack/bottle',
      estimatedPrice: 8.0,
      priority: 'must_have',
      notes: `For signature ${recipe.name}`,
    }));

    if (onAddIngredientsToShoppingList) {
      onAddIngredientsToShoppingList(items);
    } else if (onAddIngredients) {
      onAddIngredients(items);
    }
    setAddedNotification(true);
    setTimeout(() => {
      setAddedNotification(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - High Density */}
        <div className="px-4 py-3 border-b border-indigo-900 flex items-center justify-between bg-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-900 border border-indigo-700 flex items-center justify-center text-amber-400 shadow-xs">
              <GlassWater className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-indigo-900 px-1.5 py-0.2 rounded inline-block mb-0.5">
                Signature {recipe.type.toUpperCase()}
              </span>
              <h2 className="text-xs sm:text-sm font-black text-white leading-tight">
                {recipe.name}
              </h2>
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
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-xs font-black text-slate-800">
              Batch Scale ({recipe.servings} Servings)
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setServingsMultiplier(Math.max(0.5, servingsMultiplier - 0.5))}
                className="w-5 h-5 bg-white border border-slate-300 rounded font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                -
              </button>
              <span className="font-black text-slate-900 px-1">{servingsMultiplier}x</span>
              <button
                onClick={() => setServingsMultiplier(servingsMultiplier + 0.5)}
                className="w-5 h-5 bg-white border border-slate-300 rounded font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          {/* Ingredients List */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Batch Ingredients
            </h4>
            <div className="space-y-1">
              {recipe.ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                  <span>{ing}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              Step-by-Step Prep
            </h4>
            <div className="space-y-1.5">
              {recipe.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-2 text-xs text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-950 font-black flex items-center justify-center shrink-0 text-[9px]">
                    {idx + 1}
                  </span>
                  <p className="leading-snug font-medium text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-1">
            <button
              onClick={handleAddAllToShoppingList}
              className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-black text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              {addedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Ingredients Added to Shopping List!</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Add All Recipe Ingredients to Shopping List</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
