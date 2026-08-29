import React, { useState } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  Store,
  Filter,
  Search,
  Copy,
  Printer,
  CheckCircle2,
  Tag,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Layers,
  ArrowRight,
  Zap,
  Edit3,
  DollarSign,
  TrendingDown,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ShoppingItem, ItemCategory, StoreType, PriorityLevel, BrandType } from '../types';
import { EditItemModal } from './EditItemModal';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  targetBudget?: number;
  totalGuests?: number;
  onTogglePurchased: (id: string) => void;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
  onUpdateItem?: (id: string, updatedFields: Partial<ShoppingItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (item: Omit<ShoppingItem, 'id' | 'purchased'>) => void;
  onOpenSubstituteModal: (item: ShoppingItem) => void;
  onAutoAlignBudget?: () => void;
  selectedStore: string;
  onSelectStore: (store: string) => void;
}

const CATEGORIES: { id: ItemCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'food', label: 'Food & Catering' },
  { id: 'drinks', label: 'Drinks & Bar' },
  { id: 'decor', label: 'Decor & Ambience' },
  { id: 'tableware', label: 'Tableware & Paper' },
  { id: 'ice_utility', label: 'Ice & Essentials' },
  { id: 'activities', label: 'Games & Activities' },
  { id: 'favors', label: 'Favors' },
];

const STORE_LIST: StoreType[] = [
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

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  targetBudget = 350,
  totalGuests = 16,
  onTogglePurchased,
  onUpdateQuantity,
  onUpdatePrice,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onOpenSubstituteModal,
  onAutoAlignBudget,
  selectedStore,
  onSelectStore,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'to_buy' | 'purchased'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Edit item modal state
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // Inline price editing state: { [itemId]: string }
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState<string>('');

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('food');
  const [newItemStore, setNewItemStore] = useState<StoreType>('CymbalMart Grocery & Pantry');
  const [newItemBrand, setNewItemBrand] = useState<BrandType>('Cymbal Choice');
  const [newItemAisle, setNewItemAisle] = useState('Aisle 4');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('pack');
  const [newItemPrice, setNewItemPrice] = useState(10);
  const [newItemPriority, setNewItemPriority] = useState<PriorityLevel>('must_have');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Automatic Budget Recalculations across entire list
  const totalEstimated = items.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
  const totalSpent = items
    .filter((i) => i.purchased)
    .reduce((sum, i) => sum + (i.actualPrice ?? i.estimatedPrice), 0);
  const remainingBudget = targetBudget - totalSpent;
  const isOverBudget = totalEstimated > targetBudget;
  const overBudgetAmount = totalEstimated - targetBudget;
  const underBudgetAmount = targetBudget - totalEstimated;
  const costPerGuest = totalEstimated / (totalGuests || 1);

  // Calculate Cymbal Choice savings
  const cymbalChoiceSavings = items.reduce((sum, i) => {
    if (i.brand === 'Cymbal Choice') {
      return sum + (i.cymbalSavings || (i.estimatedPrice / 0.78) * 0.22);
    }
    return sum + (i.cymbalSavings || 0);
  }, 0);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedStore !== 'all' && item.store !== selectedStore) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    if (statusFilter === 'to_buy' && item.purchased) return false;
    if (statusFilter === 'purchased' && !item.purchased) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.store.toLowerCase().includes(q) ||
        (item.aisle && item.aisle.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        (item.dietaryTag && item.dietaryTag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleToggle = (item: ShoppingItem) => {
    onTogglePurchased(item.id);
    if (!item.purchased) {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
      });
    }
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAddItem({
      name: newItemName.trim(),
      category: newItemCategory,
      store: newItemStore,
      brand: newItemBrand,
      aisle: newItemAisle || undefined,
      quantity: Number(newItemQty) || 1,
      unit: newItemUnit || 'pack',
      estimatedPrice: Number(newItemPrice) || 0,
      priority: newItemPriority,
      notes: newItemNotes.trim() || undefined,
    });

    setNewItemName('');
    setNewItemNotes('');
    setShowAddForm(false);
  };

  const handleStartEditingPrice = (item: ShoppingItem) => {
    setEditingPriceId(item.id);
    setEditingPriceVal(item.estimatedPrice.toFixed(2));
  };

  const handleSaveInlinePrice = (itemId: string) => {
    const val = parseFloat(editingPriceVal);
    if (!isNaN(val) && val >= 0) {
      onUpdatePrice(itemId, Math.round(val * 100) / 100);
    }
    setEditingPriceId(null);
  };

  const handleQuickSwitchBrand = (item: ShoppingItem) => {
    if (!onUpdateItem) return;
    if (item.brand === 'Cymbal Choice') {
      // Revert to brand name
      const standardPrice = Math.round((item.estimatedPrice / 0.78) * 100) / 100;
      onUpdateItem(item.id, {
        brand: 'Brand Name',
        estimatedPrice: standardPrice,
      });
    } else {
      // Switch to Cymbal Choice with 22% discount
      const discountedPrice = Math.round(item.estimatedPrice * 0.78 * 100) / 100;
      const savings = Math.round((item.estimatedPrice - discountedPrice) * 100) / 100;
      onUpdateItem(item.id, {
        brand: 'Cymbal Choice',
        estimatedPrice: discountedPrice,
        cymbalSavings: (item.cymbalSavings || 0) + savings,
        notes: item.notes ? `${item.notes} • Cymbal Choice Value` : 'Cymbal Choice Value',
      });
    }
  };

  const handleCopyFormattedList = () => {
    const storeGroups = new Map<string, ShoppingItem[]>();
    items.forEach((item) => {
      const arr = storeGroups.get(item.store) || [];
      arr.push(item);
      storeGroups.set(item.store, arr);
    });

    let text = `🛒 CYMBALMART PARTY SHOPPING LIST\n\n`;
    text += `Target Budget: $${targetBudget.toFixed(2)} | Est. Total: $${totalEstimated.toFixed(2)}\n\n`;
    storeGroups.forEach((itemsInStore, storeName) => {
      text += `📍 ${storeName.toUpperCase()}\n`;
      itemsInStore.forEach((i) => {
        const box = i.purchased ? '[x]' : '[ ]';
        const brandStr = i.brand ? `[${i.brand}] ` : '';
        const aisleStr = i.aisle ? `(${i.aisle}) ` : '';
        text += `${box} ${brandStr}${i.name} ${aisleStr}- ${i.quantity} ${i.unit} (~$${i.estimatedPrice.toFixed(2)})\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3">
      {/* Live Budget Recalculator Header in Shopping List */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-xl p-3.5 sm:p-4 shadow-sm border border-indigo-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                Live Shopping Budget Calculator
              </span>
              <span className="text-[10px] text-indigo-200 bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700">
                {items.length} Total Items ({items.filter((i) => i.purchased).length} purchased)
              </span>
            </div>
            <p className="text-[11px] text-indigo-200 mt-0.5">
              Every quantity, brand swap, and price change automatically updates the party budget totals in real time.
            </p>
          </div>

          {/* Target vs Estimated Total Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-indigo-900/90 px-3 py-1.5 rounded-lg border border-indigo-700/80 text-right">
              <span className="text-[9px] font-black uppercase text-indigo-300 block">
                Target Budget
              </span>
              <span className="text-sm sm:text-base font-black text-white">
                ${targetBudget.toFixed(2)}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/20 text-right">
              <span className="text-[9px] font-black uppercase text-emerald-300 block">
                Recalculated Est. Total
              </span>
              <span
                className={`text-sm sm:text-base font-black ${
                  isOverBudget ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                ${totalEstimated.toFixed(2)}
              </span>
            </div>

            {/* Auto-Align Button if over budget */}
            {isOverBudget && onAutoAlignBudget && (
              <button
                id="btn-quick-auto-align-budget"
                onClick={onAutoAlignBudget}
                className="px-2.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-indigo-950 font-black text-xs rounded-lg transition-all shadow-xs flex items-center gap-1 animate-pulse"
                title="Auto-align shopping list with budget"
              >
                <Zap className="w-3.5 h-3.5 fill-indigo-950" />
                <span>Auto-Align</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-xs">
          <div className="bg-indigo-900/60 p-2 rounded-lg border border-indigo-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-indigo-300 block">Budget Status</span>
              <span
                className={`font-black text-xs ${
                  isOverBudget ? 'text-amber-300' : 'text-emerald-400'
                }`}
              >
                {isOverBudget
                  ? `+$${overBudgetAmount.toFixed(2)} Over Target`
                  : `✓ $${underBudgetAmount.toFixed(2)} Under Budget`}
              </span>
            </div>
            <TrendingDown className={`w-4 h-4 ${isOverBudget ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>

          <div className="bg-indigo-900/60 p-2 rounded-lg border border-indigo-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-indigo-300 block">Cymbal Choice Savings</span>
              <span className="font-black text-emerald-300 text-xs">
                -${cymbalChoiceSavings.toFixed(2)} saved
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <div className="bg-indigo-900/60 p-2 rounded-lg border border-indigo-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-indigo-300 block">Cost Per Guest</span>
              <span className="font-black text-white text-xs">
                ${costPerGuest.toFixed(2)} / guest
              </span>
            </div>
            <UserCheck className="w-4 h-4 text-indigo-300" />
          </div>

          <div className="bg-indigo-900/60 p-2 rounded-lg border border-indigo-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-indigo-300 block">Remaining Balance</span>
              <span className="font-black text-white text-xs">
                ${Math.max(0, remainingBudget).toFixed(2)}
              </span>
            </div>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Category Filters, and Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-shopping-items"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search CymbalMart aisles, ingredients, brands, tags..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Actions Group */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-copy-shopping-list"
              onClick={handleCopyFormattedList}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
              title="Copy organized CymbalMart shopping list to clipboard"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy List</span>
                </>
              )}
            </button>

            <button
              id="btn-print-shopping-list"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
              title="Print checklist"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              id="btn-toggle-add-item-form"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Secondary Category & Status Filter Pills - High Density */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                id={`filter-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-950 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('to_buy')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                statusFilter === 'to_buy'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              To Buy ({items.filter((i) => !i.purchased).length})
            </button>
            <button
              onClick={() => setStatusFilter('purchased')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                statusFilter === 'purchased'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Purchased ({items.filter((i) => i.purchased).length})
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Expandable Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateNewItem}
          className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 shadow-xs space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <span className="text-xs font-black uppercase text-indigo-950 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              Add Custom CymbalMart Item
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-0.5">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. CymbalMart Deli Sliders, Seltzer 12-pack..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-0.5">
                Category
              </label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-indigo-600"
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-0.5">
                Department / Store
              </label>
              <select
                value={newItemStore}
                onChange={(e) => setNewItemStore(e.target.value as StoreType)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-indigo-600"
              >
                {STORE_LIST.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-0.5">
                Brand
              </label>
              <select
                value={newItemBrand}
                onChange={(e) => setNewItemBrand(e.target.value as BrandType)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-indigo-600"
              >
                <option value="Cymbal Choice">Cymbal Choice (-22%)</option>
                <option value="Cymbal Organic">Cymbal Organic</option>
                <option value="Cymbal Club Bulk">Cymbal Club Bulk</option>
                <option value="Brand Name">Brand Name</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-0.5">
                Aisle
              </label>
              <input
                type="text"
                value={newItemAisle}
                onChange={(e) => setNewItemAisle(e.target.value)}
                placeholder="e.g. Aisle 4"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-0.5">
                Quantity & Unit
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                  className="w-14 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                />
                <input
                  type="text"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  placeholder="unit"
                  className="flex-1 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-0.5">
                Est. Total ($)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-0.5">
                Priority
              </label>
              <select
                value={newItemPriority}
                onChange={(e) => setNewItemPriority(e.target.value as PriorityLevel)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-indigo-600"
              >
                <option value="must_have">Must-Have</option>
                <option value="nice_to_have">Nice-To-Have</option>
                <option value="optional">Optional</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-indigo-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              id="btn-submit-add-item"
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-xs"
            >
              Save Item & Recalculate Budget
            </button>
          </div>
        </form>
      )}

      {/* Items List - High Density Rows */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">No items match your filter</h4>
          <p className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
            Try adjusting your aisle, category, or search filters, or add a custom item to your list.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              onSelectStore('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              id={`item-card-${item.id}`}
              className={`group bg-white rounded-lg border transition-all duration-150 p-2 sm:p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                item.purchased
                  ? 'border-emerald-200/90 bg-emerald-50/20 text-slate-500 shadow-none'
                  : 'border-slate-200 hover:border-indigo-300 shadow-2xs'
              }`}
            >
              {/* Left Checkbox & Name */}
              <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                <button
                  id={`btn-toggle-item-${item.id}`}
                  onClick={() => handleToggle(item)}
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition-all ${
                    item.purchased
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'border border-slate-300 hover:border-indigo-500 bg-white'
                  }`}
                  title={item.purchased ? 'Mark as to-buy' : 'Mark as purchased'}
                >
                  {item.purchased && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-xs sm:text-sm font-bold tracking-tight ${
                        item.purchased ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.name}
                    </span>

                    {/* Brand Badge with Quick Swap Click */}
                    {item.brand && (
                      <button
                        type="button"
                        onClick={() => handleQuickSwitchBrand(item)}
                        title="Click to toggle between Cymbal Choice (-22% savings) and Brand Name"
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded border transition-all cursor-pointer hover:opacity-80 ${
                          item.brand === 'Cymbal Choice'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.brand === 'Cymbal Organic'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : item.brand === 'Cymbal Club Bulk'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {item.brand === 'Cymbal Choice' ? '★ Cymbal Choice' : item.brand}
                      </button>
                    )}

                    {/* Aisle Tag */}
                    {item.aisle && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                        {item.aisle}
                      </span>
                    )}

                    {/* Dietary Tag if present */}
                    {item.dietaryTag && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.dietaryTag}
                      </span>
                    )}

                    {/* Priority Badge */}
                    {item.priority === 'must_have' ? (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-100">
                        Must-Have
                      </span>
                    ) : item.priority === 'optional' ? (
                      <span className="text-[9px] font-medium uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                        Optional
                      </span>
                    ) : null}
                  </div>

                  {/* Notes / Tips */}
                  {item.notes && (
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <span className="text-amber-600 font-bold">Tip:</span> {item.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: Quantity Stepper, Price, and Smart Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* Quantity Stepper with proportional automatic price scaling */}
                <div className="flex items-center bg-slate-100 rounded-md p-0.5 text-xs">
                  <button
                    onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    className="w-5 h-5 flex items-center justify-center font-black text-slate-600 hover:text-slate-900 rounded"
                    title="Decrease quantity & recalculate budget"
                  >
                    -
                  </button>
                  <span className="px-1.5 font-bold text-slate-800 min-w-[24px] text-center text-xs">
                    {item.quantity} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-5 h-5 flex items-center justify-center font-black text-slate-600 hover:text-slate-900 rounded"
                    title="Increase quantity & recalculate budget"
                  >
                    +
                  </button>
                </div>

                {/* Estimated Price with Inline Direct Click-To-Edit */}
                <div className="text-right min-w-[65px]">
                  {editingPriceId === item.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-slate-500">$</span>
                      <input
                        type="number"
                        step="0.10"
                        autoFocus
                        value={editingPriceVal}
                        onChange={(e) => setEditingPriceVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveInlinePrice(item.id);
                          if (e.key === 'Escape') setEditingPriceId(null);
                        }}
                        onBlur={() => handleSaveInlinePrice(item.id)}
                        className="w-16 px-1 py-0.5 bg-white border border-emerald-500 rounded text-xs font-black text-slate-900 text-right outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEditingPrice(item)}
                      title="Click to edit price directly"
                      className="text-right group-hover:bg-slate-50 px-1 rounded transition-all cursor-pointer"
                    >
                      <div className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700">
                        ${item.estimatedPrice.toFixed(2)}
                      </div>
                      <span className="text-[9px] text-slate-400 block -mt-0.5">Est. total ✎</span>
                    </button>
                  )}
                </div>

                {/* Edit Full Item Button */}
                <button
                  id={`btn-edit-item-${item.id}`}
                  onClick={() => setEditingItem(item)}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md transition-all"
                  title="Update item details, brand, quantity and price"
                >
                  <Edit3 className="w-3 h-3 text-slate-600" />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                {/* Smart Substitute AI Button */}
                <button
                  id={`btn-substitute-${item.id}`}
                  onClick={() => onOpenSubstituteModal(item)}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md transition-all"
                  title="Find AI-powered smart swaps"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">Swap</span>
                </button>

                {/* Delete Button */}
                <button
                  id={`btn-delete-item-${item.id}`}
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                  title="Remove item & recalculate budget"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(updated) => {
          if (onUpdateItem) {
            onUpdateItem(updated.id, updated);
          } else {
            // fallback
            onUpdatePrice(updated.id, updated.estimatedPrice);
            onUpdateQuantity(updated.id, updated.quantity);
          }
          setEditingItem(null);
        }}
        targetBudget={targetBudget}
        currentTotalEstimated={totalEstimated}
      />
    </div>
  );
};
