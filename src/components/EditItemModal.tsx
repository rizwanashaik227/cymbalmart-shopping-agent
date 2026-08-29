import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  Tag,
  DollarSign,
  Layers,
  Store,
  HelpCircle,
  Zap,
  Info,
} from 'lucide-react';
import { ShoppingItem, ItemCategory, StoreType, PriorityLevel, BrandType } from '../types';

interface EditItemModalProps {
  isOpen: boolean;
  item: ShoppingItem | null;
  onClose: () => void;
  onSave: (updatedItem: ShoppingItem) => void;
  targetBudget?: number;
  currentTotalEstimated?: number;
}

const CATEGORY_OPTIONS: { id: ItemCategory; label: string }[] = [
  { id: 'food', label: 'Food & Catering' },
  { id: 'drinks', label: 'Drinks & Bar' },
  { id: 'decor', label: 'Decor & Ambience' },
  { id: 'tableware', label: 'Tableware & Paper' },
  { id: 'ice_utility', label: 'Ice & Essentials' },
  { id: 'activities', label: 'Games & Activities' },
  { id: 'favors', label: 'Favors' },
];

const STORE_OPTIONS: StoreType[] = [
  'CymbalMart Produce & Deli',
  'CymbalMart Bakery',
  'CymbalMart Butcher & Seafood',
  'CymbalMart Grocery & Pantry',
  'CymbalMart Cellars & Beverages',
  'CymbalMart Party & Tableware',
  'CymbalMart Ice & Frozen',
  'Cymbal Club Wholesale Bulk',
  'Grocery / Supermarket',
  'Costco / Wholesale',
  'Party / Amazon',
  'Liquor Store',
  'Bakery',
  'Dollar Store / General',
  'Specialty',
];

const COMMON_DIETARY_TAGS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Nut-Free',
  'Dairy-Free',
  'Non-Alcoholic',
  'Organic',
  'Kosher',
  'Halal',
];

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
  targetBudget = 350,
  currentTotalEstimated = 0,
}) => {
  if (!isOpen || !item) return null;

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [store, setStore] = useState<StoreType>(item.store);
  const [aisle, setAisle] = useState(item.aisle || '');
  const [brand, setBrand] = useState<BrandType>(item.brand || 'Cymbal Choice');
  const [quantity, setQuantity] = useState<number>(item.quantity || 1);
  const [unit, setUnit] = useState(item.unit || 'pack');
  
  // Calculate unit price from original item
  const initialUnitPrice = item.quantity > 0 ? item.estimatedPrice / item.quantity : item.estimatedPrice;
  const [unitPrice, setUnitPrice] = useState<number>(Math.round(initialUnitPrice * 100) / 100);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(item.estimatedPrice);
  
  const [priority, setPriority] = useState<PriorityLevel>(item.priority || 'must_have');
  const [dietaryTag, setDietaryTag] = useState(item.dietaryTag || '');
  const [notes, setNotes] = useState(item.notes || '');

  // Keep unit price and estimated price linked
  const handleQuantityChange = (newQty: number) => {
    const q = Math.max(1, newQty);
    setQuantity(q);
    const newTotal = Math.round(unitPrice * q * 100) / 100;
    setEstimatedPrice(newTotal);
  };

  const handleUnitPriceChange = (newUnitPrice: number) => {
    const p = Math.max(0, newUnitPrice);
    setUnitPrice(p);
    const newTotal = Math.round(p * quantity * 100) / 100;
    setEstimatedPrice(newTotal);
  };

  const handleEstimatedPriceChange = (newTotal: number) => {
    const t = Math.max(0, newTotal);
    setEstimatedPrice(t);
    if (quantity > 0) {
      setUnitPrice(Math.round((t / quantity) * 100) / 100);
    }
  };

  const handleBrandChange = (newBrand: BrandType) => {
    setBrand(newBrand);
    if (newBrand === 'Cymbal Choice' && brand !== 'Cymbal Choice') {
      // 22% discount
      const discountedUnitPrice = Math.round(unitPrice * 0.78 * 100) / 100;
      setUnitPrice(discountedUnitPrice);
      setEstimatedPrice(Math.round(discountedUnitPrice * quantity * 100) / 100);
    } else if (brand === 'Cymbal Choice' && newBrand !== 'Cymbal Choice') {
      // Restore standard price
      const standardUnitPrice = Math.round((unitPrice / 0.78) * 100) / 100;
      setUnitPrice(standardUnitPrice);
      setEstimatedPrice(Math.round(standardUnitPrice * quantity * 100) / 100);
    }
  };

  // Live budget impact calculation
  const priceDelta = estimatedPrice - item.estimatedPrice;
  const projectedNewTotal = Math.max(0, currentTotalEstimated + priceDelta);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...item,
      name: name.trim(),
      category,
      store,
      aisle: aisle.trim() || undefined,
      brand,
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'pack',
      estimatedPrice: Number(estimatedPrice) || 0,
      priority,
      dietaryTag: dietaryTag.trim() || undefined,
      notes: notes.trim() || undefined,
      cymbalSavings:
        brand === 'Cymbal Choice'
          ? (item.cymbalSavings || 0) + (priceDelta < 0 ? Math.abs(priceDelta) : 2.5)
          : item.cymbalSavings,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 my-auto">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-indigo-950 font-bold shadow-xs">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Update Shopping Item</h3>
              <p className="text-[10px] text-indigo-200">
                Changes will automatically recalculate total budget metrics
              </p>
            </div>
          </div>

          <button
            id="btn-close-edit-item-modal"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-indigo-300 hover:text-white hover:bg-indigo-900 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Budget Impact Preview Pill */}
        <div className="bg-emerald-50/80 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Budget Recalculation:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Current: <strong className="text-slate-800">${currentTotalEstimated.toFixed(2)}</strong>
            </span>
            <span className="text-slate-400">➔</span>
            <span className="font-black text-emerald-800">
              New: ${projectedNewTotal.toFixed(2)}
            </span>
            {priceDelta !== 0 && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                  priceDelta < 0
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {priceDelta < 0 ? `-$${Math.abs(priceDelta).toFixed(2)} (Savings)` : `+$${priceDelta.toFixed(2)}`}
              </span>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Row 1: Item Name */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
              Item Name *
            </label>
            <input
              id="edit-item-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Row 2: Brand Selection with Cymbal Choice Highlight */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700">
                Brand Selection & Value Tier
              </label>
              {brand === 'Cymbal Choice' && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                  ★ 22% Store Brand Discount Applied
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['Cymbal Choice', 'Cymbal Organic', 'Cymbal Club Bulk', 'Brand Name'] as BrandType[]).map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => handleBrandChange(b)}
                  className={`px-2 py-1.5 rounded-lg font-bold text-left border transition-all text-[11px] flex flex-col justify-between ${
                    brand === b
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{b}</span>
                  <span className="text-[9px] font-normal text-slate-500">
                    {b === 'Cymbal Choice'
                      ? 'Best Value (-22%)'
                      : b === 'Cymbal Organic'
                      ? 'Non-GMO / Clean'
                      : b === 'Cymbal Club Bulk'
                      ? 'Multi-Pack Savvy'
                      : 'Standard Brand'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Quantity, Unit, Unit Price, and Total Price (linked) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Quantity
              </label>
              <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-black text-slate-700"
                >
                  -
                </button>
                <input
                  id="edit-item-quantity-input"
                  type="number"
                  min="1"
                  max="999"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-full text-center font-bold text-slate-900 py-1.5 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 font-black text-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Unit Type
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pack, bottles, lbs..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1">
                Unit Price ($)
              </label>
              <input
                id="edit-item-unit-price-input"
                type="number"
                step="0.05"
                min="0"
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-1">
                Total Price ($)
              </label>
              <input
                id="edit-item-total-price-input"
                type="number"
                step="0.10"
                min="0"
                value={estimatedPrice}
                onChange={(e) => handleEstimatedPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-emerald-50 border border-emerald-400 font-black text-emerald-950 rounded-lg outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Row 4: Department & Aisle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Store / Department
              </label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value as StoreType)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 outline-none focus:border-emerald-500"
              >
                {STORE_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Aisle / In-Store Location
              </label>
              <input
                type="text"
                value={aisle}
                onChange={(e) => setAisle(e.target.value)}
                placeholder="e.g. Aisle 4, Aisle 7 (Deli), Freezer 2"
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 5: Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 outline-none focus:border-emerald-500"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Priority Tier
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 outline-none focus:border-emerald-500"
              >
                <option value="must_have">Must-Have (Core Essentials)</option>
                <option value="nice_to_have">Nice-To-Have (Enhancements)</option>
                <option value="optional">Optional (First to cut if over budget)</option>
              </select>
            </div>
          </div>

          {/* Row 6: Dietary Tag Chips */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
              Dietary & Allergen Tag
            </label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {COMMON_DIETARY_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setDietaryTag(dietaryTag === tag ? '' : tag)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                    dietaryTag === tag
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={dietaryTag}
              onChange={(e) => setDietaryTag(e.target.value)}
              placeholder="Or enter custom dietary note..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none"
            />
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
              Notes & Shopping Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions, e.g. chill before serving, ask deli counter for thin slice..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              id="btn-save-item-changes"
              type="submit"
              className="px-5 py-2 rounded-lg font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Update Item & Recalculate Budget</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
