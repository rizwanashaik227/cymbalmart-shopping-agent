import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  ShoppingBag,
  Clock,
  MapPin,
  Truck,
  Store,
  ShieldCheck,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  Calendar,
  DollarSign,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Wheat,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PartyPlan, ShoppingItem, StoreType, BrandType } from '../types';

interface RefineCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
  onApplyPlanUpdate: (updatedPlan: PartyPlan) => void;
  onOpenInStoreMode: () => void;
}

export const RefineCheckoutModal: React.FC<RefineCheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  onApplyPlanUpdate,
  onOpenInStoreMode,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'refine_constraints' | 'checkout_finalize'>(
    'refine_constraints'
  );

  // Constraint adjustments state
  const [switchedToCymbalChoice, setSwitchedToCymbalChoice] = useState(false);
  const [appliedDietarySafety, setAppliedDietarySafety] = useState(false);
  const [appliedDeliPlatterSwaps, setAppliedDeliPlatterSwaps] = useState(false);
  const [aisleSorted, setAisleSorted] = useState(false);

  // Checkout State
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'curbside' | 'delivery' | 'instore_scan'>(
    'curbside'
  );
  const [selectedStore, setSelectedStore] = useState('CymbalMart Supercenter #104 - West Valley');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('Saturday 10:00 AM - 11:00 AM (Day of Party)');
  const [isCymbalClubMember, setIsCymbalClubMember] = useState(true);
  const [isFinalized, setIsFinalized] = useState(false);
  const [copiedCalendar, setCopiedCalendar] = useState(false);

  if (!isOpen) return null;

  // Calculate pricing
  const subtotal = plan.shoppingList.reduce((sum, i) => sum + i.estimatedPrice, 0);
  const memberDiscounts = plan.shoppingList.reduce((sum, i) => sum + (i.cymbalSavings || 2.5), 0);
  const deliveryFee = fulfillmentMethod === 'delivery' ? (isCymbalClubMember ? 0 : 4.99) : 0;
  const tax = Math.round(subtotal * 0.0825 * 100) / 100;
  const finalTotal = Math.max(0, subtotal - (isCymbalClubMember ? memberDiscounts : 0) + deliveryFee + tax);

  // Constraint Actions
  const handleSwitchAllToCymbalChoice = () => {
    const updatedList: ShoppingItem[] = plan.shoppingList.map((item) => {
      if (item.brand !== 'Cymbal Choice') {
        const discountPrice = Math.round(item.estimatedPrice * 0.78 * 100) / 100;
        return {
          ...item,
          name: item.name.replace(/Brand Name/gi, '').trim() || item.name,
          brand: 'Cymbal Choice' as BrandType,
          estimatedPrice: discountPrice,
          cymbalSavings: (item.cymbalSavings || 0) + (item.estimatedPrice - discountPrice),
          notes: item.notes ? `${item.notes} • Cymbal Choice Value` : 'Cymbal Choice Store Brand',
        };
      }
      return item;
    });

    onApplyPlanUpdate({
      ...plan,
      shoppingList: updatedList,
    });
    setSwitchedToCymbalChoice(true);
  };

  const handleApplyDietarySafetyCheck = () => {
    const updatedList: ShoppingItem[] = plan.shoppingList.map((item) => {
      if (item.category === 'food') {
        if (!item.dietaryTag && plan.dietary.glutenFree > 0 && item.name.toLowerCase().includes('tortilla')) {
          return {
            ...item,
            name: 'Cymbal Choice Certified Gluten-Free White Corn Tortillas',
            dietaryTag: '100% Certified GF',
          };
        }
        if (!item.dietaryTag && plan.dietary.vegan > 0 && (item.name.toLowerCase().includes('dip') || item.name.toLowerCase().includes('snack'))) {
          return {
            ...item,
            dietaryTag: 'Vegan Friendly',
          };
        }
      }
      return item;
    });

    onApplyPlanUpdate({
      ...plan,
      shoppingList: updatedList,
    });
    setAppliedDietarySafety(true);
  };

  const handleApplyDeliPlatterSwaps = () => {
    const updatedList: ShoppingItem[] = plan.shoppingList.map((item) => {
      if (item.category === 'food' && item.priority === 'must_have' && !item.name.includes('Platter')) {
        return {
          ...item,
          store: 'CymbalMart Produce & Deli' as StoreType,
          aisle: 'Deli Prep Counter',
          notes: 'Pre-ordered ready-to-serve CymbalMart Deli Platter (Zero Host Cooking Time)',
        };
      }
      return item;
    });

    onApplyPlanUpdate({
      ...plan,
      shoppingList: updatedList,
    });
    setAppliedDeliPlatterSwaps(true);
  };

  const handleAisleWalkOrderSort = () => {
    const aislePriorityOrder: Record<string, number> = {
      'CymbalMart Produce & Deli': 1,
      'CymbalMart Bakery': 2,
      'CymbalMart Butcher & Seafood': 3,
      'CymbalMart Grocery & Pantry': 4,
      'CymbalMart Cellars & Beverages': 5,
      'CymbalMart Party & Tableware': 6,
      'Cymbal Club Wholesale Bulk': 7,
      'CymbalMart Ice & Frozen': 8,
    };

    const sortedList = [...plan.shoppingList].sort((a, b) => {
      const orderA = aislePriorityOrder[a.store] || 99;
      const orderB = aislePriorityOrder[b.store] || 99;
      return orderA - orderB;
    });

    onApplyPlanUpdate({
      ...plan,
      shoppingList: sortedList,
    });
    setAisleSorted(true);
  };

  const handleFinalizeAndPlaceOrder = () => {
    setIsFinalized(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleCopyCalendarTimeline = () => {
    let text = `📅 CYMBALMART PARTY PREP SCHEDULE: ${plan.title}\n\n`;
    plan.timeline.forEach((m) => {
      const phaseLabel = m.phase.replace(/_/g, ' ').toUpperCase();
      text += `[${phaseLabel}] ${m.task}\n`;
    });
    text += `\n🛒 CymbalMart Pickup/Delivery: ${fulfillmentMethod.toUpperCase()} (${deliveryTimeSlot})\n`;
    text += `📍 Store: ${selectedStore}\n`;
    text += `💵 Total Budget: $${finalTotal.toFixed(2)}`;

    navigator.clipboard.writeText(text);
    setCopiedCalendar(true);
    setTimeout(() => setCopiedCalendar(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-indigo-900 flex items-center justify-between bg-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-indigo-950 shadow-xs font-black">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Step 3 • Final Stage
                </span>
                <span className="text-indigo-400 text-[10px]">•</span>
                <span className="text-[10px] text-indigo-200">CUJ Refine & Checkout</span>
              </div>
              <h2 className="text-xs sm:text-sm font-black text-white tracking-tight uppercase mt-0.5">
                Refine Constraints & Finalize Plan
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-indigo-300 hover:text-white hover:bg-indigo-900 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Refine Constraints vs Checkout & Finalize */}
        <div className="px-4 pt-2.5 flex gap-2 border-b border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveSubTab('refine_constraints')}
            className={`pb-2 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'refine_constraints'
                ? 'border-indigo-600 text-indigo-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>1. Adjust for Constraints</span>
          </button>
          <button
            onClick={() => setActiveSubTab('checkout_finalize')}
            className={`pb-2 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'checkout_finalize'
                ? 'border-emerald-600 text-emerald-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Finalize Plan & CymbalMart Checkout</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-white space-y-4">
          {activeSubTab === 'refine_constraints' ? (
            <div className="space-y-3.5">
              {/* Constraint 1: Budget Constraint Solver */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        Budget Constraint: Cymbal Choice Store Brand Optimizer
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Automatically convert name brand groceries and tableware to certified <strong className="text-indigo-950 font-bold">Cymbal Choice</strong> items for an immediate ~22% savings on your bill.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-emerald-700">
                      <span>💰 Estimated Savings: ~${memberDiscounts.toFixed(2)}</span>
                      <span>•</span>
                      <span>{plan.shoppingList.length} items evaluated</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSwitchAllToCymbalChoice}
                    disabled={switchedToCymbalChoice}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 flex items-center gap-1 shadow-2xs ${
                      switchedToCymbalChoice
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-indigo-950 hover:bg-indigo-900 text-white'
                    }`}
                  >
                    {switchedToCymbalChoice ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        <span>Cymbal Choice Applied</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Apply Brand Swaps</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Constraint 2: Dietary Constraint Solver */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        Dietary Constraints: Allergen & Vegan/GF Safety Verification
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Accommodates your registered guest dietary restrictions ({plan.dietary.glutenFree} GF, {plan.dietary.vegetarian} Veg, {plan.dietary.vegan} Vegan, {plan.dietary.nonAlcoholic} Non-drinkers). Ensures all party items have certified allergen safe labels.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                        🌾 Gluten-Free Safe
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                        🌱 Vegan Options
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyDietarySafetyCheck}
                    disabled={appliedDietarySafety}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 flex items-center gap-1 shadow-2xs ${
                      appliedDietarySafety
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-indigo-950 hover:bg-indigo-900 text-white'
                    }`}
                  >
                    {appliedDietarySafety ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        <span>Dietary Verified</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Apply Dietary Pass</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Constraint 3: Time & Prep Constraint (Host Convenience) */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        Host Time Constraint: CymbalMart Deli Ready-to-Serve Platters
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Short on kitchen time? Automatically swap raw cooking ingredients with pre-arranged fresh party platters prepared by the CymbalMart Deli team on the morning of your event.
                    </p>
                  </div>

                  <button
                    onClick={handleApplyDeliPlatterSwaps}
                    disabled={appliedDeliPlatterSwaps}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 flex items-center gap-1 shadow-2xs ${
                      appliedDeliPlatterSwaps
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-indigo-950 hover:bg-indigo-900 text-white'
                    }`}
                  >
                    {appliedDeliPlatterSwaps ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        <span>Deli Platters Set</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Swap to Ready-Made</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Constraint 4: Physical Store Walk Order Sorting */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        Store Walk Optimization: CymbalMart Physical Aisle Order
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      Sort list strictly according to the physical CymbalMart layout: Produce & Deli &rarr; Bakery &rarr; Butcher &rarr; Pantry &rarr; Cellars &rarr; Party Tableware &rarr; Freezers (Ice).
                    </p>
                  </div>

                  <button
                    onClick={handleAisleWalkOrderSort}
                    disabled={aisleSorted}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 flex items-center gap-1 shadow-2xs ${
                      aisleSorted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-indigo-950 hover:bg-indigo-900 text-white'
                    }`}
                  >
                    {aisleSorted ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        <span>Aisle Walk-Order Sorted</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>Optimize Aisle Walk</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Proceed to Checkout Banner */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveSubTab('checkout_finalize')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <span>Proceed to Finalize & Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isFinalized ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded">
                      Order Confirmed & Plan Finalized
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                      Party Blueprint & CymbalMart Order Ready!
                    </h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mt-0.5">
                      Your shopping list of {plan.shoppingList.length} curated items and party prep schedule has been saved.
                    </p>
                  </div>

                  {/* Summary receipt box */}
                  <div className="bg-white rounded-lg border border-emerald-200 p-3 text-left max-w-md mx-auto text-xs space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Fulfillment:</span>
                      <span className="text-slate-900 uppercase font-black">{fulfillmentMethod}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Time Slot:</span>
                      <span className="text-slate-900">{deliveryTimeSlot}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Store Location:</span>
                      <span className="text-slate-900">{selectedStore}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-1.5 flex justify-between font-black text-emerald-800 text-sm">
                      <span>Total Paid:</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={handleCopyCalendarTimeline}
                      className="px-3.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      {copiedCalendar ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Timeline Copied!</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Copy Prep Timeline</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenInStoreMode();
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Launch In-Store Mode</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Fulfillment Method Selection */}
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                      Select CymbalMart Fulfillment Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          id: 'curbside',
                          label: 'Curbside Pickup',
                          sub: 'Ready in trunk loading bay',
                          icon: Truck,
                        },
                        {
                          id: 'delivery',
                          label: 'Express 2-Hr Delivery',
                          sub: 'Direct to your doorstep',
                          icon: ShoppingBag,
                        },
                        {
                          id: 'instore_scan',
                          label: 'In-Store Self-Scan',
                          sub: 'Digital mobile barcode pass',
                          icon: Store,
                        },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = fulfillmentMethod === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setFulfillmentMethod(opt.id as any)}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-600 shadow-2xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-700 stroke-[3]" />}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900">{opt.label}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">{opt.sub}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Store & Timing Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">
                        CymbalMart Store Location
                      </label>
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                      >
                        <option value="CymbalMart Supercenter #104 - West Valley">
                          CymbalMart Supercenter #104 (West Valley)
                        </option>
                        <option value="CymbalMart Metro #208 - Downtown Hub">
                          CymbalMart Metro #208 (Downtown Hub)
                        </option>
                        <option value="CymbalMart Marketplace #315 - Northside Plaza">
                          CymbalMart Marketplace #315 (Northside Plaza)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">
                        Fulfillment Window
                      </label>
                      <select
                        value={deliveryTimeSlot}
                        onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                      >
                        <option value="Saturday 10:00 AM - 11:00 AM (Day of Party)">
                          Saturday 10:00 AM - 11:00 AM (Party Day Morning)
                        </option>
                        <option value="Friday 4:00 PM - 5:00 PM (1 Day Before Prep)">
                          Friday 4:00 PM - 5:00 PM (1 Day Before Prep)
                        </option>
                        <option value="Saturday 1:00 PM - 2:00 PM (Party Day Afternoon)">
                          Saturday 1:00 PM - 2:00 PM (Party Day Afternoon)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Cymbal Club Member Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950 text-white text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-400 text-indigo-950 flex items-center justify-center font-black text-[10px]">
                        ★
                      </div>
                      <div>
                        <span className="font-black text-white">Cymbal Club Member Discounts</span>
                        <p className="text-[10px] text-indigo-300">Free delivery & instant store brand cashbacks</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCymbalClubMember(!isCymbalClubMember)}
                      className={`px-2 py-1 rounded text-[11px] font-black transition-all ${
                        isCymbalClubMember ? 'bg-emerald-500 text-indigo-950' : 'bg-indigo-800 text-indigo-300'
                      }`}
                    >
                      {isCymbalClubMember ? 'Applied ✓' : 'Add Pass'}
                    </button>
                  </div>

                  {/* Itemized Order Breakdown */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Curated Items ({plan.shoppingList.length} items):</span>
                      <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                    {isCymbalClubMember && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Cymbal Club Discounts:</span>
                        <span>-${memberDiscounts.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Fulfillment & Service Fee:</span>
                      <span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Estimated Sales Tax (8.25%):</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-indigo-950">
                      <span>Final Order Total:</span>
                      <span className="text-base font-extrabold text-emerald-600">${finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-medium">
                        Target Budget: ${plan.budget.target.toFixed(0)} • {finalTotal <= plan.budget.target ? '✓ Under Budget' : '+$' + (finalTotal - plan.budget.target).toFixed(0) + ' over'}
                      </span>
                    </div>
                  </div>

                  {/* Final Checkout Button */}
                  <button
                    id="btn-finalize-party-checkout"
                    onClick={handleFinalizeAndPlaceOrder}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalize Party Plan & Place CymbalMart Order (${finalTotal.toFixed(2)})</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
