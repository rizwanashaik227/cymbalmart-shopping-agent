import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BudgetOverview } from './components/BudgetOverview';
import { ShoppingListView } from './components/ShoppingListView';
import { TimelineView } from './components/TimelineView';
import { PartySetupModal } from './components/PartySetupModal';
import { DrinkFoodCalculatorModal } from './components/DrinkFoodCalculatorModal';
import { AgentChatDrawer } from './components/AgentChatDrawer';
import { SubstituteModal } from './components/SubstituteModal';
import { BudgetOptimizerModal } from './components/BudgetOptimizerModal';
import { RecipeModal } from './components/RecipeModal';
import { InStoreModeModal } from './components/InStoreModeModal';
import { RefineCheckoutModal } from './components/RefineCheckoutModal';
import { VoiceAssistantHUD } from './components/VoiceAssistantHUD';
import { PRESET_PARTIES } from './data/presetParties';
import { PartyPlan, ShoppingItem, TimelineMilestone, BrandType } from './types';
import { Sparkles, ShoppingBag, Calculator, Smartphone, Plus, ArrowRight, CheckCircle2, Mic } from 'lucide-react';

const STORAGE_KEY = 'party_planner_active_blueprint_v1';

export default function App() {
  const [currentPlan, setCurrentPlan] = useState<PartyPlan>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.title && Array.isArray(parsed.shoppingList)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved plan:', e);
      }
    }
    return PRESET_PARTIES[0];
  });

  const [activeTab, setActiveTab] = useState<'shopping' | 'timeline' | 'budget'>('shopping');
  const [selectedStore, setSelectedStore] = useState<string>('all');

  // Voice Assistant HUD State
  const [isVoiceHUDOpen, setIsVoiceHUDOpen] = useState<boolean>(true);

  // Modals state
  const [isPartySetupOpen, setIsPartySetupOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [isInStoreModeOpen, setIsInStoreModeOpen] = useState(false);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isRefineCheckoutOpen, setIsRefineCheckoutOpen] = useState(false);

  // Substitute modal target
  const [substituteItem, setSubstituteItem] = useState<ShoppingItem | null>(null);

  // Get active modal name for voice context
  const getOpenModalName = () => {
    if (isPartySetupOpen) return 'define';
    if (isCalculatorOpen) return 'calculator';
    if (isOptimizerOpen) return 'optimizer';
    if (isInStoreModeOpen) return 'instore';
    if (isRecipeOpen) return 'recipe';
    if (isRefineCheckoutOpen) return 'checkout';
    if (isChatDrawerOpen) return 'chat';
    return 'none';
  };

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPlan));
  }, [currentPlan]);

  // Handlers for shopping list with automatic proportional price and budget recalculations
  const handleTogglePurchased = (id: string) => {
    setCurrentPlan((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === id ? { ...item, purchased: !item.purchased } : item
      ),
    }));
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    setCurrentPlan((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) => {
        if (item.id === id) {
          const oldQty = item.quantity || 1;
          const unitPrice = item.estimatedPrice / oldQty;
          const updatedPrice = Math.round(unitPrice * newQty * 100) / 100;
          return { ...item, quantity: newQty, estimatedPrice: updatedPrice };
        }
        return item;
      }),
    }));
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setCurrentPlan((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === id ? { ...item, estimatedPrice: newPrice } : item
      ),
    }));
  };

  const handleUpdateItem = (id: string, updatedFields: Partial<ShoppingItem>) => {
    setCurrentPlan((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === id ? { ...item, ...updatedFields } : item
      ),
    }));
  };

  const handleDeleteItem = (id: string) => {
    setCurrentPlan((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.filter((item) => item.id !== id),
    }));
  };

  const handleAddItem = (newItem: Omit<ShoppingItem, 'id' | 'purchased'>) => {
    const item: ShoppingItem = {
      ...newItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      purchased: false,
    };
    setCurrentPlan((prev) => ({
      ...prev,
      shoppingList: [item, ...prev.shoppingList],
    }));
  };

  const handleAddMultipleItems = (itemsToAdd: Partial<ShoppingItem>[]) => {
    const formatted: ShoppingItem[] = itemsToAdd.map((itm, idx) => ({
      id: `item-gen-${Date.now()}-${idx}`,
      name: itm.name || 'Party Item',
      category: itm.category || 'food',
      store: (itm.store as any) || 'CymbalMart Grocery & Pantry',
      brand: itm.brand || 'Cymbal Choice',
      aisle: itm.aisle,
      quantity: itm.quantity || 1,
      unit: itm.unit || 'pack',
      estimatedPrice: itm.estimatedPrice || 8.0,
      purchased: false,
      priority: itm.priority || 'must_have',
      dietaryTag: itm.dietaryTag,
      notes: itm.notes,
    }));

    setCurrentPlan((prev) => ({
      ...prev,
      shoppingList: [...formatted, ...prev.shoppingList],
    }));
  };

  const handleAutoAlignBudget = () => {
    const targetBudget = currentPlan.budget.target || 350;
    let currentTotal = currentPlan.shoppingList.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
    let list: ShoppingItem[] = JSON.parse(JSON.stringify(currentPlan.shoppingList));

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

    // Step 3: Trim nice_to_have non-food if still over
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

    setCurrentPlan((prev) => ({
      ...prev,
      shoppingList: list,
    }));
  };

  const handleApplySubstitution = (
    originalItemId: string,
    replacement: Partial<ShoppingItem>
  ) => {
    setCurrentPlan((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === originalItemId
          ? {
              ...item,
              name: replacement.name || item.name,
              store: (replacement.store as any) || item.store,
              brand: replacement.brand || item.brand,
              aisle: replacement.aisle || item.aisle,
              estimatedPrice: replacement.estimatedPrice ?? item.estimatedPrice,
              notes: replacement.notes || item.notes,
            }
          : item
      ),
    }));
  };

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_PARTIES.find((p) => p.id === presetId);
    if (found) {
      setCurrentPlan(JSON.parse(JSON.stringify(found)));
      setSelectedStore('all');
    }
  };

  const handleToggleMilestone = (id: string) => {
    setCurrentPlan((prev) => ({
      ...prev,
      timeline: prev.timeline.map((m) =>
        m.id === id ? { ...m, completed: !m.completed } : m
      ),
    }));
  };

  const handleAddMilestone = (task: string, phase: TimelineMilestone['phase']) => {
    const newM: TimelineMilestone = {
      id: `time-${Date.now()}`,
      task,
      phase,
      completed: false,
      category: 'prep',
    };
    setCurrentPlan((prev) => ({
      ...prev,
      timeline: [...prev.timeline, newM],
    }));
  };

  // Comprehensive Hands-Free Voice Command Executor
  const handleVoiceCommand = useCallback(
    (action: string, params: any, spokenResponse: string) => {
      switch (action) {
        case 'ADD_ITEM': {
          if (params.item) {
            const newItem: ShoppingItem = {
              id: `item-v-${Date.now()}`,
              name: params.item.name || 'Party Item',
              category: params.item.category || 'food',
              store: (params.item.store as any) || 'CymbalMart Grocery & Pantry',
              brand: (params.item.brand as any) || 'Cymbal Choice',
              aisle: params.item.aisle || 'Aisles 4-5 (Pantry & Snacks)',
              quantity: Number(params.item.quantity) || 1,
              unit: params.item.unit || 'pack',
              estimatedPrice: Number(params.item.estimatedPrice) || 8.0,
              purchased: false,
              priority: (params.item.priority as any) || 'must_have',
              dietaryTag: params.item.dietaryTag,
              notes: params.item.notes || 'Added via Voice Control',
            };
            setCurrentPlan((prev) => ({
              ...prev,
              shoppingList: [newItem, ...prev.shoppingList],
            }));
          }
          break;
        }

        case 'DELETE_ITEM': {
          const targetName = (params.targetName || '').toLowerCase();
          if (targetName) {
            setCurrentPlan((prev) => ({
              ...prev,
              shoppingList: prev.shoppingList.filter(
                (item) => !item.name.toLowerCase().includes(targetName)
              ),
            }));
          }
          break;
        }

        case 'TOGGLE_PURCHASED': {
          const targetName = (params.targetName || '').toLowerCase();
          if (targetName) {
            setCurrentPlan((prev) => ({
              ...prev,
              shoppingList: prev.shoppingList.map((item) =>
                item.name.toLowerCase().includes(targetName)
                  ? { ...item, purchased: !item.purchased }
                  : item
              ),
            }));
          }
          break;
        }

        case 'MARK_ALL_PURCHASED': {
          const state = params.purchased !== false;
          setCurrentPlan((prev) => ({
            ...prev,
            shoppingList: prev.shoppingList.map((item) => ({ ...item, purchased: state })),
          }));
          break;
        }

        case 'SWITCH_TAB': {
          if (params.tab && ['shopping', 'timeline', 'budget'].includes(params.tab)) {
            setActiveTab(params.tab);
          }
          break;
        }

        case 'FILTER_STORE': {
          if (params.store) {
            setSelectedStore(params.store);
            setActiveTab('shopping');
          }
          break;
        }

        case 'SWITCH_TO_CYMBAL_CHOICE': {
          setCurrentPlan((prev) => {
            const updated = prev.shoppingList.map((item) => {
              if (item.brand !== 'Cymbal Choice') {
                const discountPrice = Math.round(item.estimatedPrice * 0.78 * 100) / 100;
                return {
                  ...item,
                  brand: 'Cymbal Choice' as BrandType,
                  estimatedPrice: discountPrice,
                  cymbalSavings: (item.cymbalSavings || 0) + (item.estimatedPrice - discountPrice),
                };
              }
              return item;
            });
            return { ...prev, shoppingList: updated };
          });
          break;
        }

        case 'AUTO_ALIGN_BUDGET': {
          handleAutoAlignBudget();
          break;
        }

        case 'SELECT_PRESET': {
          if (params.presetId) {
            handleSelectPreset(params.presetId);
          }
          break;
        }

        case 'OPEN_MODAL': {
          // Close others first
          setIsPartySetupOpen(false);
          setIsCalculatorOpen(false);
          setIsOptimizerOpen(false);
          setIsInStoreModeOpen(false);
          setIsRecipeOpen(false);
          setIsRefineCheckoutOpen(false);
          setIsChatDrawerOpen(false);

          if (params.modal === 'define') setIsPartySetupOpen(true);
          else if (params.modal === 'calculator') setIsCalculatorOpen(true);
          else if (params.modal === 'optimizer') setIsOptimizerOpen(true);
          else if (params.modal === 'instore') setIsInStoreModeOpen(true);
          else if (params.modal === 'recipe') setIsRecipeOpen(true);
          else if (params.modal === 'checkout') setIsRefineCheckoutOpen(true);
          else if (params.modal === 'chat') setIsChatDrawerOpen(true);
          break;
        }

        case 'CLOSE_MODALS': {
          setIsPartySetupOpen(false);
          setIsCalculatorOpen(false);
          setIsOptimizerOpen(false);
          setIsInStoreModeOpen(false);
          setIsRecipeOpen(false);
          setIsRefineCheckoutOpen(false);
          setIsChatDrawerOpen(false);
          setSubstituteItem(null);
          break;
        }

        case 'ADD_RECIPE_INGREDIENTS': {
          const recipe = currentPlan.signatureRecipe || currentPlan.signatureDrink || currentPlan.signatureDish;
          if (recipe && recipe.ingredients && Array.isArray(recipe.ingredients)) {
            const items = recipe.ingredients.map((ing: string, i: number) => ({
              id: `recipe-ing-${Date.now()}-${i}`,
              name: ing.replace(/^[\d\/\s\w\.]+\s+of\s+/i, '').trim() || ing,
              category: 'drinks' as any,
              store: 'CymbalMart Grocery & Pantry' as any,
              brand: 'Cymbal Choice' as any,
              aisle: 'Aisle 8 (Beverages)',
              quantity: 1,
              unit: 'pack',
              estimatedPrice: 4.5,
              purchased: false,
              priority: 'must_have' as any,
              notes: `Recipe ingredient for ${recipe.name}`,
            }));
            setCurrentPlan((prev) => ({
              ...prev,
              shoppingList: [...items, ...prev.shoppingList],
            }));
          }
          break;
        }

        case 'TOGGLE_MILESTONE': {
          const target = (params.targetName || '').toLowerCase();
          if (target) {
            setCurrentPlan((prev) => ({
              ...prev,
              timeline: prev.timeline.map((m) =>
                m.task.toLowerCase().includes(target) ? { ...m, completed: !m.completed } : m
              ),
            }));
          }
          break;
        }

        default:
          break;
      }
    },
    [currentPlan]
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-28 sm:pb-24 font-sans">
      {/* Top Sticky Navigation */}
      <Navbar
        currentPlan={currentPlan}
        onOpenNewPlan={() => setIsPartySetupOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenInStoreMode={() => setIsInStoreModeOpen(true)}
        onOpenRecipe={() => setIsRecipeOpen(true)}
        onOpenRefineCheckout={() => setIsRefineCheckoutOpen(true)}
        onSelectPreset={handleSelectPreset}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenChat={() => setIsChatDrawerOpen(true)}
        chatUnreadCount={0}
        onToggleVoice={() => setIsVoiceHUDOpen(!isVoiceHUDOpen)}
        isVoiceActive={isVoiceHUDOpen}
      />

      {/* Main High Density Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 pt-3.5">
        {/* Dynamic Budget & Store Overview Card */}
        <BudgetOverview
          plan={currentPlan}
          onOpenOptimizer={() => setIsOptimizerOpen(true)}
          onApplyPlanUpdate={(updated) => setCurrentPlan(updated)}
          selectedStore={selectedStore}
          onSelectStore={setSelectedStore}
        />

        {/* Tab Content */}
        {activeTab === 'shopping' ? (
          <ShoppingListView
            items={currentPlan.shoppingList}
            targetBudget={currentPlan.budget.target || 350}
            totalGuests={currentPlan.guestCount.total || 16}
            onTogglePurchased={handleTogglePurchased}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdatePrice={handleUpdatePrice}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onOpenSubstituteModal={(item) => setSubstituteItem(item)}
            onAutoAlignBudget={handleAutoAlignBudget}
            selectedStore={selectedStore}
            onSelectStore={setSelectedStore}
          />
        ) : (
          <TimelineView
            timeline={currentPlan.timeline}
            onToggleMilestone={handleToggleMilestone}
            onAddMilestone={handleAddMilestone}
          />
        )}
      </main>

      {/* Floating CymbalMart Assistant Chatbot Widget (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          id="btn-floating-cymbalmart-assistant"
          onClick={() => setIsChatDrawerOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-black text-xs shadow-xl hover:shadow-2xl transition-all border-2 border-emerald-400 group scale-100 hover:scale-105"
          title="Chat with CymbalMart Assistant for grocery help, deals, recipes and aisle info"
        >
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-emerald-700 shadow-xs font-black">
            <Sparkles className="w-3.5 h-3.5 fill-emerald-600" />
          </div>
          <div className="flex flex-col items-start text-left leading-tight pr-1">
            <span className="text-[11px] font-black tracking-tight">CymbalMart Assistant</span>
            <span className="text-[9px] text-emerald-100 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Online • AI Planner
            </span>
          </div>
        </button>
      </div>

      {/* Hands-Free Voice Control Floating Assistant HUD */}
      <VoiceAssistantHUD
        currentPlan={currentPlan}
        currentTab={activeTab}
        openModalName={getOpenModalName()}
        onExecuteCommand={handleVoiceCommand}
        isOpen={isVoiceHUDOpen}
        onClose={() => setIsVoiceHUDOpen(false)}
      />

      {/* Slide-out CymbalMart Assistant Chat Drawer */}
      <AgentChatDrawer
        isOpen={isChatDrawerOpen}
        onClose={() => setIsChatDrawerOpen(false)}
        plan={currentPlan}
        currentPlan={currentPlan}
        onAddItemsToShoppingList={handleAddMultipleItems}
        onAddItems={handleAddMultipleItems}
        onApplySubstitution={handleApplySubstitution}
        onUpdatePlan={(updated) => setCurrentPlan(updated)}
        onOpenOptimizer={() => setIsOptimizerOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenInStoreMode={() => setIsInStoreModeOpen(true)}
      />

      {/* Step 1 CUJ: Party Definition Wizard Modal */}
      <PartySetupModal
        isOpen={isPartySetupOpen}
        onClose={() => setIsPartySetupOpen(false)}
        onPlanGenerated={(newPlan) => {
          setCurrentPlan(newPlan);
          setSelectedStore('all');
        }}
        onSavePlan={(newPlan) => {
          setCurrentPlan(newPlan);
          setSelectedStore('all');
        }}
        onSelectPreset={(presetId) => {
          handleSelectPreset(presetId);
        }}
      />

      {/* Smart Drink & Food Portion Calculator Modal */}
      <DrinkFoodCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        plan={currentPlan}
        guestCount={currentPlan.guestCount.total}
        durationHours={currentPlan.guestCount.durationHours || 4}
        onAddCalculatedItems={handleAddMultipleItems}
        onApplyCalculationsToPlan={(updated) => setCurrentPlan(updated)}
      />

      {/* AI Smart Substitute Modal */}
      <SubstituteModal
        isOpen={!!substituteItem}
        item={substituteItem}
        onClose={() => setSubstituteItem(null)}
        onApply={(replacement) => {
          if (substituteItem) {
            handleApplySubstitution(substituteItem.id, replacement);
          }
          setSubstituteItem(null);
        }}
      />

      {/* Step 2 CUJ: AI Budget Optimizer Modal */}
      <BudgetOptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        plan={currentPlan}
        onApplyOptimizedPlan={(updated) => {
          setCurrentPlan(updated);
        }}
      />

      {/* Step 3 CUJ: Refine & Checkout Modal */}
      <RefineCheckoutModal
        isOpen={isRefineCheckoutOpen}
        onClose={() => setIsRefineCheckoutOpen(false)}
        plan={currentPlan}
        onApplyPlanUpdate={(updated) => setCurrentPlan(updated)}
        onOpenInStoreMode={() => {
          setIsRefineCheckoutOpen(false);
          setIsInStoreModeOpen(true);
        }}
      />

      {/* AI Recipe Scaler & Ingredient Importer Modal */}
      <RecipeModal
        isOpen={isRecipeOpen}
        onClose={() => setIsRecipeOpen(false)}
        recipe={currentPlan.signatureDrink || currentPlan.signatureDish}
        guestCount={currentPlan.guestCount.total}
        onAddIngredientsToShoppingList={handleAddMultipleItems}
        onAddIngredients={handleAddMultipleItems}
      />

      {/* In-Store Interactive Check-off & Aisle Navigator Mode */}
      <InStoreModeModal
        isOpen={isInStoreModeOpen}
        onClose={() => setIsInStoreModeOpen(false)}
        plan={currentPlan}
        onToggleItem={handleTogglePurchased}
      />
    </div>
  );
}
