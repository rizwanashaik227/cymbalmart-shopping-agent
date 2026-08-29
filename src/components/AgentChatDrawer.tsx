import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  Check,
  Lightbulb,
  RefreshCw,
  MessageSquare,
  Compass,
  DollarSign,
  UtensilsCrossed,
  ShieldCheck,
  Store,
  Zap,
} from 'lucide-react';
import { PartyPlan, ChatMessage, ShoppingItem } from '../types';

interface AgentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: PartyPlan;
  currentPlan?: PartyPlan;
  onAddItemsToShoppingList?: (items: Partial<ShoppingItem>[]) => void;
  onAddItems?: (items: Partial<ShoppingItem>[]) => void;
  onOpenOptimizer?: () => void;
  onOpenCalculator?: () => void;
  onOpenInStoreMode?: () => void;
  onApplySubstitution?: (originalItemId: string, replacement: Partial<ShoppingItem>) => void;
  onUpdatePlan?: (updated: PartyPlan) => void;
}

const CUSTOMER_PROMPT_CHIPS = [
  { icon: '🏷️', label: 'Cymbal Choice Brand Savings (-22%)', prompt: 'Show me Cymbal Choice brand savings and grocery swaps' },
  { icon: '📍', label: 'Where are aisles located?', prompt: 'What aisle are party items, drinks, ice, and deli platters in?' },
  { icon: '🍹', label: 'Scale batch drink recipe', prompt: 'Calculate exact drink, wine, beer, and ice quantities for our guests' },
  { icon: '🥗', label: 'Suggest Vegan/GF swaps', prompt: 'Recommend allergen-friendly and vegetarian platter options' },
  { icon: '🥪', label: 'Order Cymbal Deli Platters', prompt: 'What ready-to-serve deli platters can I get to reduce kitchen prep?' },
];

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  isOpen,
  onClose,
  plan: propPlan,
  currentPlan,
  onAddItemsToShoppingList,
  onAddItems,
  onOpenOptimizer,
  onOpenCalculator,
  onOpenInStoreMode,
}) => {
  const activePlan = propPlan || currentPlan;
  const planTitle = activePlan?.title || 'Party Event';
  const guestsCount = activePlan?.guestCount?.total || 16;
  const targetBudget = activePlan?.budget?.target || 350;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'agent',
      text: `👋 Welcome to CymbalMart! I'm your **CymbalMart Assistant**.\n\nI've loaded your "${planTitle}" event for **${guestsCount} guests** (Target Budget: **$${targetBudget}**).\n\nHow can I help you today? I can look up item aisle locations, recommend our money-saving **Cymbal Choice** store brands, calculate beverage math, or add fresh deli platters to your list!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: '🛒 CymbalMart Aisle Directory', actionType: 'AISLE_INFO' },
        { label: '💰 Check Cymbal Choice Deals', actionType: 'OPTIMIZE_BUDGET' },
        { label: '🍹 Drink & Ice Math', actionType: 'CALC' },
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentPlan: activePlan,
          chatHistory: messages.slice(-5),
        }),
      });

      const data = await res.json();
      if (data.success) {
        const agentMsg: ChatMessage = {
          id: `ag-${Date.now()}`,
          sender: 'agent',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: data.suggestedActions || [],
          itemsToAdd: data.itemsToAdd || [],
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else {
        throw new Error(data.error || 'Chat request failed');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: "I'm having a brief connection delay with our server, but I can help you with in-store aisle routing, budget swaps, and party drink calculations!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; actionType: string; payload?: any }) => {
    if (action.actionType === 'OPTIMIZE' || action.actionType === 'OPTIMIZE_BUDGET') {
      onOpenOptimizer?.();
    } else if (action.actionType === 'CALC' || action.actionType === 'CHECK_DRINKS') {
      onOpenCalculator?.();
    } else if (action.actionType === 'INSTORE' && onOpenInStoreMode) {
      onOpenInStoreMode();
    } else if (action.actionType === 'AISLE_INFO') {
      handleSendMessage('Please give me the complete CymbalMart Aisle Directory and where each department is located.');
    } else if (action.actionType === 'ADD_DELI') {
      handleSendMessage('Show me the top CymbalMart Fresh Deli platters with prices and add them to my shopping list.');
    } else {
      handleSendMessage(action.label);
    }
  };

  const handleAddItemsFromAgent = (itemsToAdd: Partial<ShoppingItem>[]) => {
    if (onAddItemsToShoppingList) {
      onAddItemsToShoppingList(itemsToAdd);
    } else if (onAddItems) {
      onAddItems(itemsToAdd);
    }
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'agent',
        text: `✓ Successfully added ${itemsToAdd.length} CymbalMart items directly to your shopping list!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header - High Density Customer Assistant Branding */}
      <div className="px-4 py-3 border-b border-indigo-900 flex items-center justify-between bg-indigo-950 text-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-indigo-950 font-black shadow-xs shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-xs sm:text-sm tracking-tight text-white">
                CymbalMart Assistant
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className="text-[10px] text-indigo-200">
              Customer Shopping & Party Planning AI Concierge
            </p>
          </div>
        </div>

        <button
          id="btn-close-cymbalmart-assistant"
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-indigo-300 hover:text-white hover:bg-indigo-900 transition-all"
          title="Close CymbalMart Assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Customer Store Bar */}
      <div className="bg-indigo-900/60 px-3 py-1.5 border-b border-indigo-800 text-[10px] text-indigo-200 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Store className="w-3 h-3 text-emerald-400" />
          <span>CymbalMart Store #402 • Open 7 AM – 11 PM</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-300 font-bold">
          <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>Cymbal Choice -22%</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-xl p-3 text-xs leading-relaxed shadow-2xs ${
                m.sender === 'user'
                  ? 'bg-indigo-950 text-white font-medium rounded-br-xs'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
              }`}
            >
              {m.sender === 'agent' && (
                <div className="flex items-center gap-1.5 font-bold text-[10px] text-emerald-700 uppercase mb-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CymbalMart Assistant</span>
                </div>
              )}

              <div className="whitespace-pre-wrap leading-relaxed space-y-1">
                {m.text.split('\n').map((line, lIdx) => {
                  if (line.startsWith('•') || line.startsWith('-')) {
                    return (
                      <div key={lIdx} className="flex items-start gap-1 pl-1">
                        <span className="text-emerald-600 font-bold shrink-0">•</span>
                        <span>{line.replace(/^[•-]\s*/, '')}</span>
                      </div>
                    );
                  }
                  return <p key={lIdx}>{line}</p>;
                })}
              </div>

              {/* Items to add button if provided by agent */}
              {m.itemsToAdd && m.itemsToAdd.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase text-indigo-950">
                      Recommended CymbalMart Items:
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">
                      {m.itemsToAdd.length} Items
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-2">
                    {m.itemsToAdd.map((itm, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{itm.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                            {itm.brand && (
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-1 rounded border border-emerald-200">
                                {itm.brand}
                              </span>
                            )}
                            {itm.aisle && <span>{itm.aisle}</span>}
                            <span>• {itm.quantity} {itm.unit}</span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-900 ml-2 shrink-0">
                          ${itm.estimatedPrice?.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    id="btn-add-agent-suggested-items"
                    onClick={() => handleAddItemsFromAgent(m.itemsToAdd!)}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add All {m.itemsToAdd.length} to Shopping List</span>
                  </button>
                </div>
              )}

              {/* Suggested Action Buttons */}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="mt-2.5 pt-2 flex flex-wrap gap-1.5 border-t border-slate-100">
                  {m.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleActionClick(action)}
                      className="text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-2 py-1 rounded-md border border-indigo-200/80 transition-all flex items-center gap-1"
                    >
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-medium">
              {m.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-lg w-fit text-xs text-slate-600 font-medium animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            <span>CymbalMart Assistant is checking inventory and pricing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Customer Action Chips */}
      <div className="px-3 py-2 border-t border-slate-100 bg-white">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Customer Quick Inquiries</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          {CUSTOMER_PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.prompt)}
              className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 border border-transparent text-slate-700 font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap transition-all shrink-0 flex items-center gap-1 text-[11px]"
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="input-cymbalmart-assistant-chat"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask CymbalMart Assistant for aisle info, recipes, deals..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
          <button
            id="btn-send-cymbalmart-assistant-chat"
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all shadow-xs"
            title="Send message to CymbalMart Assistant"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

