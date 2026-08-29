import React, { useState } from 'react';
import { X, Sparkles, Users, DollarSign, Clock, MapPin, Wine, Cake, Compass, Wand2, Check } from 'lucide-react';
import { PartyPlan, DietaryCounts } from '../types';
import { PRESET_PARTIES } from '../data/presetParties';

interface PartySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated?: (newPlan: PartyPlan) => void;
  onSavePlan?: (newPlan: PartyPlan) => void;
  onSelectPreset?: (presetId: string) => void;
}

const EVENT_TYPES = [
  'Birthday Party',
  'Dinner & Game Night',
  'Backyard BBQ / Cookout',
  'Cocktail & Tapas Soiree',
  'Kids Theme Celebration',
  'Baby / Bridal Shower',
  'Graduation Bash',
  'Holiday / Seasonal Gathering',
  'Chic Brunch',
  'Housewarming',
];

const THEME_IDEAS = [
  'Tropical Tiki & Luau',
  'Retro 80s Neon Disco',
  'Rustic Italian Trattoria',
  'Fiesta Taco Bar & Margaritas',
  'Enchanted Garden Soiree',
  'Classic Southern BBQ',
  'Golden Champagne & Tapas',
  'Epic Movie & Snack Marathon',
  'Dino Safari Adventure',
  'Cozy Winter Chalet',
];

export const PartySetupModal: React.FC<PartySetupModalProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
  onSavePlan,
  onSelectPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'ai_generate' | 'presets'>('ai_generate');
  const [eventType, setEventType] = useState('Birthday Party');
  const [theme, setTheme] = useState('Retro 80s Neon Disco');
  const [adults, setAdults] = useState(16);
  const [kids, setKids] = useState(0);
  const [budget, setBudget] = useState(400);
  const [budgetTier, setBudgetTier] = useState<'thrifty' | 'balanced' | 'premium' | 'luxury'>('balanced');
  const [duration, setDuration] = useState(4);
  const [venueType, setVenueType] = useState<'indoor' | 'backyard' | 'park' | 'rented_venue'>('backyard');
  const [specialRequests, setSpecialRequests] = useState('');

  // Dietary counts
  const [dietary, setDietary] = useState<DietaryCounts>({
    vegetarian: 2,
    vegan: 0,
    glutenFree: 2,
    nutFree: 0,
    nonAlcoholic: 3,
    otherNotes: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/plan-party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          theme,
          adults,
          kids,
          budget,
          budgetTier,
          duration,
          venueType,
          dietary,
          specialRequests,
        }),
      });

      const data = await response.json();
      if (data.success && data.plan) {
        const fullPlan: PartyPlan = {
          ...data.plan,
          id: `party-${Date.now()}`,
          durationHours: duration,
          venueType,
          dietary,
        };

        if (typeof onPlanGenerated === 'function') {
          onPlanGenerated(fullPlan);
        } else if (typeof onSavePlan === 'function') {
          onSavePlan(fullPlan);
        }
        onClose();
      } else {
        throw new Error(data.error || 'Failed to generate party blueprint');
      }
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setGenerationError(err.message || 'Error communicating with AI service');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header - High Density */}
        <div className="px-4 py-3 border-b border-indigo-900 flex items-center justify-between bg-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-indigo-950 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight uppercase">
                Plan a New Party
              </h2>
              <p className="text-[10px] text-indigo-200">
                AI Shopping Agent calculates food, drinks, store routes & budgets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-indigo-300 hover:text-white hover:bg-indigo-900 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection: AI Custom Blueprint vs Ready Presets */}
        <div className="px-4 pt-2.5 flex gap-2 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('ai_generate')}
            className={`pb-2 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ai_generate'
                ? 'border-indigo-600 text-indigo-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Custom Generator</span>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2 px-3 text-xs font-black border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-indigo-600 text-indigo-950'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Curated Party Packs ({PRESET_PARTIES.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-white">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_PARTIES.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl p-3.5 transition-all flex flex-col justify-between hover:shadow-xs cursor-pointer group"
                  onClick={() => {
                    if (typeof onSelectPreset === 'function') {
                      onSelectPreset(preset.id);
                    }
                    onClose();
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                        {preset.eventType}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        ${preset.budget.target} Target
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {preset.title}
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {preset.vibeDescription}
                    </p>

                    <div className="mt-2.5 flex items-center gap-2.5 text-[10px] font-bold text-slate-500">
                      <span>👥 {preset.guestCount.total} Guests</span>
                      <span>⏱️ {preset.durationHours}h</span>
                      <span>🛒 {preset.shoppingList.length} Items</span>
                    </div>
                  </div>

                  <button
                    className="mt-3 w-full py-1.5 bg-white group-hover:bg-indigo-950 text-slate-800 group-hover:text-white border border-slate-300 group-hover:border-indigo-950 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>Load This Blueprint</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleGeneratePlan} className="space-y-3 sm:space-y-3.5">
              {/* Event Type & Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Event Type
                  </label>
                  <select
                    id="select-event-type"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Theme / Atmosphere
                  </label>
                  <input
                    id="input-theme"
                    type="text"
                    required
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g. Retro Neon Disco, Tuscan Trattoria"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                  {/* Quick Theme Suggestions */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {THEME_IDEAS.slice(0, 4).map((th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => setTheme(th)}
                        className="text-[9px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded"
                      >
                        {th}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Guest Counts & Duration */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">
                    Adults
                  </label>
                  <input
                    id="input-guest-adults"
                    type="number"
                    min="1"
                    max="200"
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-black text-slate-900 text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">
                    Kids / Teens
                  </label>
                  <input
                    id="input-guest-kids"
                    type="number"
                    min="0"
                    max="100"
                    value={kids}
                    onChange={(e) => setKids(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-black text-slate-900 text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">
                    Duration (Hrs)
                  </label>
                  <input
                    id="input-duration-hours"
                    type="number"
                    min="1"
                    max="12"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-black text-slate-900 text-center"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-600 mb-0.5">
                    Venue
                  </label>
                  <select
                    id="select-venue-type"
                    value={venueType}
                    onChange={(e) => setVenueType(e.target.value as any)}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                  >
                    <option value="indoor">Indoor Living</option>
                    <option value="backyard">Backyard / Patio</option>
                    <option value="park">Park / Outdoor</option>
                    <option value="rented_venue">Rented Space</option>
                  </select>
                </div>
              </div>

              {/* Budget Target & Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1 flex items-center justify-between">
                    <span>Target Budget ($ USD)</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ~${Math.round(budget / (adults + kids || 1))}/guest
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">
                      $
                    </span>
                    <input
                      id="input-budget-target"
                      type="number"
                      min="50"
                      max="10000"
                      step="25"
                      value={budget}
                      onChange={(e) => setBudget(Math.max(50, Number(e.target.value)))}
                      className="w-full pl-6 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Budget Priority Style
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'thrifty', label: 'Thrifty' },
                      { id: 'balanced', label: 'Balanced' },
                      { id: 'premium', label: 'Premium' },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setBudgetTier(tier.id as any)}
                        className={`py-1.5 text-xs font-black rounded-lg border transition-all ${
                          budgetTier === tier.id
                            ? 'bg-indigo-950 border-indigo-950 text-white shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dietary Preferences Counter Row */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Dietary Accommodations (Guest Counts)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold">Vegetarian</span>
                    <input
                      type="number"
                      min="0"
                      value={dietary.vegetarian}
                      onChange={(e) =>
                        setDietary({ ...dietary, vegetarian: Number(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-0.5 mt-0.5 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold">Gluten-Free</span>
                    <input
                      type="number"
                      min="0"
                      value={dietary.glutenFree}
                      onChange={(e) =>
                        setDietary({ ...dietary, glutenFree: Number(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-0.5 mt-0.5 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold">Vegan</span>
                    <input
                      type="number"
                      min="0"
                      value={dietary.vegan}
                      onChange={(e) =>
                        setDietary({ ...dietary, vegan: Number(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-0.5 mt-0.5 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 font-bold">Non-Drinkers</span>
                    <input
                      type="number"
                      min="0"
                      value={dietary.nonAlcoholic}
                      onChange={(e) =>
                        setDietary({ ...dietary, nonAlcoholic: Number(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-0.5 mt-0.5 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Special Custom Requests */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Specific Requests or Food Preferences (Optional)
                </label>
                <input
                  id="input-special-requests"
                  type="text"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Include photo booth props, signature mocktail punch, zero plastic tableware"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              {generationError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {generationError}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  id="btn-submit-generate-plan"
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 px-4 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Generating Custom Shopping Blueprint...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Generate Party Blueprint with AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
