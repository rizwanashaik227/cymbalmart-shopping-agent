import React, { useState } from 'react';
import { X, Calculator, Wine, Beer, CupSoda, Snowflake, Utensils, Sparkles, RefreshCw, Check } from 'lucide-react';
import { PartyPlan, ShoppingItem } from '../types';

interface DrinkFoodCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: PartyPlan;
  onApplyCalculationsToPlan?: (updatedPlan: PartyPlan) => void;
  guestCount?: number;
  durationHours?: number;
  onAddCalculatedItems?: (items: Partial<ShoppingItem>[]) => void;
}

export const DrinkFoodCalculatorModal: React.FC<DrinkFoodCalculatorModalProps> = ({
  isOpen,
  onClose,
  plan,
  onApplyCalculationsToPlan,
  guestCount,
  durationHours,
  onAddCalculatedItems,
}) => {
  const [adults, setAdults] = useState(plan?.guestCount?.adults ?? (guestCount ?? 16));
  const [kids, setKids] = useState(plan?.guestCount?.kids ?? 0);
  const [duration, setDuration] = useState(plan?.durationHours ?? (durationHours ?? 4));
  const [drinkStyle, setDrinkStyle] = useState<'beer_wine' | 'full_bar' | 'punch_beer' | 'mostly_mocktail'>('beer_wine');
  const [foodStyle, setFoodStyle] = useState<'cocktail_bites' | 'full_meal' | 'buffet_heavy' | 'dessert_only'>('full_meal');
  const [isOutdoorSummer, setIsOutdoorSummer] = useState(plan?.venueType === 'backyard' || plan?.venueType === 'park');
  const [appliedNotification, setAppliedNotification] = useState(false);

  if (!isOpen) return null;

  const totalGuests = adults + kids;
  // Mathematical Formulas
  const drinksPerAdult = 2 + Math.max(0, duration - 1);
  const totalAlcoholDrinks = adults * drinksPerAdult;

  // Split ratios based on drinkStyle
  let wineBottles = 0;
  let beerCans = 0;
  let spiritBottles = 0;
  let sodaCans = Math.ceil(totalGuests * (duration * 0.8));
  let waterGallons = Math.ceil(totalGuests * 0.4);
  let iceLbs = Math.ceil(totalGuests * (isOutdoorSummer ? 2.0 : 1.5));

  if (drinkStyle === 'beer_wine') {
    // 40% Wine, 60% Beer
    wineBottles = Math.ceil((totalAlcoholDrinks * 0.4) / 5);
    beerCans = Math.ceil(totalAlcoholDrinks * 0.6);
  } else if (drinkStyle === 'full_bar') {
    // 30% Wine, 40% Beer, 30% Liquor (16 drinks/bottle)
    wineBottles = Math.ceil((totalAlcoholDrinks * 0.3) / 5);
    beerCans = Math.ceil(totalAlcoholDrinks * 0.4);
    spiritBottles = Math.ceil((totalAlcoholDrinks * 0.3) / 16);
  } else if (drinkStyle === 'punch_beer') {
    // 50% Batch Punch, 50% Beer
    beerCans = Math.ceil(totalAlcoholDrinks * 0.5);
    wineBottles = Math.ceil((totalAlcoholDrinks * 0.2) / 5);
  } else {
    // Mostly Mocktail
    wineBottles = Math.ceil((totalAlcoholDrinks * 0.2) / 5);
    beerCans = Math.ceil(totalAlcoholDrinks * 0.2);
    sodaCans = Math.ceil(totalGuests * duration * 1.5);
  }

  // Food formulas
  let appetizerBites = 0;
  let mainPortions = totalGuests;
  let dessertServings = Math.ceil(totalGuests * 1.25);
  let platesCount = Math.ceil(totalGuests * 1.5);
  let napkinsCount = Math.ceil(totalGuests * 3);

  if (foodStyle === 'cocktail_bites') {
    appetizerBites = totalGuests * (duration > 3 ? 10 : 7);
  } else if (foodStyle === 'full_meal') {
    appetizerBites = totalGuests * 4;
  } else if (foodStyle === 'buffet_heavy') {
    appetizerBites = totalGuests * 5;
    mainPortions = Math.ceil(totalGuests * 1.2);
  } else {
    appetizerBites = totalGuests * 2;
    dessertServings = totalGuests * 2;
  }

  const handleApplyToPlan = () => {
    if (onApplyCalculationsToPlan && plan) {
      const updatedPlan: PartyPlan = {
        ...plan,
        guestCount: { adults, kids, total: totalGuests },
        durationHours: duration,
        drinkFormula: {
          drinksPerAdult,
          totalDrinks: totalAlcoholDrinks,
          wineBottles,
          beerCans,
          sodaCans,
          waterBottlesOrGal: `${waterGallons} Gallons`,
          iceLbs,
        },
        foodFormula: {
          appetizersPerPerson: Math.round(appetizerBites / (totalGuests || 1)),
          mainCoursePortions: mainPortions,
          dessertServings,
          recommendedStyle: foodStyle.replace('_', ' ').toUpperCase(),
        },
      };
      onApplyCalculationsToPlan(updatedPlan);
    }

    if (onAddCalculatedItems) {
      const calculatedItems: Partial<ShoppingItem>[] = [];
      if (beerCans > 0) {
        calculatedItems.push({
          name: 'Beer / Craft Seltzers',
          category: 'drinks',
          store: 'CymbalMart Cellars & Beverages',
          quantity: Math.ceil(beerCans / 6),
          unit: '6-packs',
          estimatedPrice: Math.ceil(beerCans / 6) * 11.99,
          priority: 'must_have',
          notes: `Portioned for ${adults} drinking guests`,
        });
      }
      if (wineBottles > 0) {
        calculatedItems.push({
          name: 'Party Table Wine (Red / White / Rosé)',
          category: 'drinks',
          store: 'CymbalMart Cellars & Beverages',
          quantity: wineBottles,
          unit: '750ml bottles',
          estimatedPrice: wineBottles * 12.99,
          priority: 'must_have',
          notes: `Estimated ${wineBottles * 5} 5oz pours`,
        });
      }
      if (iceLbs > 0) {
        calculatedItems.push({
          name: 'Party Ice Bags (10 lb bag)',
          category: 'drinks',
          store: 'CymbalMart Ice & Frozen',
          quantity: Math.ceil(iceLbs / 10),
          unit: '10 lb bags',
          estimatedPrice: Math.ceil(iceLbs / 10) * 3.49,
          priority: 'must_have',
          notes: `${iceLbs} lbs calculated for beverages & chilling`,
        });
      }
      onAddCalculatedItems(calculatedItems);
    }

    setAppliedNotification(true);
    setTimeout(() => {
      setAppliedNotification(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-300 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header - High Density */}
        <div className="px-4 py-3 border-b border-indigo-900 flex items-center justify-between bg-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-indigo-950 shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white tracking-tight uppercase">
                Party Math & Quantity Calculator
              </h2>
              <p className="text-[10px] text-indigo-200">
                Accurate beverage, ice, food portion, and tableware equations
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
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[80vh] overflow-y-auto bg-white">
          {/* Parameter Sliders */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-0.5">
                Adults: {adults}
              </label>
              <input
                type="range"
                min="2"
                max="100"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full accent-indigo-950"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-0.5">
                Kids: {kids}
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={kids}
                onChange={(e) => setKids(Number(e.target.value))}
                className="w-full accent-indigo-950"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-0.5">
                Duration: {duration} hrs
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-indigo-950"
              />
            </div>
          </div>

          {/* Bar Style & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                Bar Service Strategy
              </label>
              <select
                value={drinkStyle}
                onChange={(e) => setDrinkStyle(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              >
                <option value="beer_wine">Wine & Craft Beer (Classic)</option>
                <option value="punch_beer">Batch Punch & Beer (Best Value)</option>
                <option value="full_bar">Full Bar (Liquor, Wine & Beer)</option>
                <option value="mostly_mocktail">Low/Non-Alcoholic Spritzers</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                Meal & Food Format
              </label>
              <select
                value={foodStyle}
                onChange={(e) => setFoodStyle(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              >
                <option value="full_meal">Main Meal + Light Appetizers</option>
                <option value="buffet_heavy">Heavy Grazing Buffet (No sit-down)</option>
                <option value="cocktail_bites">Cocktail Bites Only (Finger Foods)</option>
                <option value="dessert_only">Late Night Dessert & Drinks</option>
              </select>
            </div>
          </div>

          {/* Calculated Output Grid */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Calculated Quantities Formula Output
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center">
                <Wine className="w-4 h-4 text-rose-700 mx-auto mb-0.5" />
                <span className="text-[10px] font-black uppercase text-rose-900">Wine</span>
                <div className="text-sm font-black text-rose-950 mt-0.5">
                  {wineBottles} <span className="text-[10px] font-normal">bottles</span>
                </div>
                <span className="text-[9px] text-rose-700 font-medium block">~5 glasses/bottle</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center">
                <Beer className="w-4 h-4 text-amber-700 mx-auto mb-0.5" />
                <span className="text-[10px] font-black uppercase text-amber-900">Beer / Seltzers</span>
                <div className="text-sm font-black text-amber-950 mt-0.5">
                  {beerCans} <span className="text-[10px] font-normal">cans</span>
                </div>
                <span className="text-[9px] text-amber-700 font-medium block">{Math.ceil(beerCans / 12)} packs of 12</span>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-2.5 text-center">
                <Snowflake className="w-4 h-4 text-cyan-700 mx-auto mb-0.5" />
                <span className="text-[10px] font-black uppercase text-cyan-900">Party Ice</span>
                <div className="text-sm font-black text-cyan-950 mt-0.5">
                  {iceLbs} <span className="text-[10px] font-normal">lbs</span>
                </div>
                <span className="text-[9px] text-cyan-700 font-medium block">
                  {Math.ceil(iceLbs / 10)} x 10lb bags
                </span>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 text-center">
                <CupSoda className="w-4 h-4 text-indigo-700 mx-auto mb-0.5" />
                <span className="text-[10px] font-black uppercase text-indigo-900">Soft Drinks</span>
                <div className="text-sm font-black text-indigo-950 mt-0.5">
                  {sodaCans} <span className="text-[10px] font-normal">cans</span>
                </div>
                <span className="text-[9px] text-indigo-700 font-medium block">+ {waterGallons} gal water</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                <span className="text-[10px] font-black uppercase text-slate-600">Appetizers</span>
                <div className="text-xs font-black text-slate-900 mt-0.5">
                  {appetizerBites} <span className="text-[10px] font-normal">total bites</span>
                </div>
                <span className="text-[9px] text-slate-500 block">
                  ~{Math.round(appetizerBites / (totalGuests || 1))} per guest
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                <span className="text-[10px] font-black uppercase text-slate-600">Plates & Napkins</span>
                <div className="text-xs font-black text-slate-900 mt-0.5">
                  {platesCount} / {napkinsCount}
                </div>
                <span className="text-[9px] text-slate-500 block">1.5x plates, 3x napkins</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase text-slate-600">Dessert Servings</span>
                <div className="text-xs font-black text-slate-900 mt-0.5">
                  {dessertServings} <span className="text-[10px] font-normal">portions</span>
                </div>
                <span className="text-[9px] text-slate-500 block">Cakes or sweets</span>
              </div>
            </div>
          </div>

          {/* Action to Sync to Plan */}
          <div className="pt-1">
            <button
              id="btn-apply-calculations"
              onClick={handleApplyToPlan}
              className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-white font-black rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              {appliedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Calculations Synced to Party Plan!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                  <span>Update Party Formulas & Quantities</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
