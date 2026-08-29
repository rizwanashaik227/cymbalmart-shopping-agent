import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Send,
  Zap,
  Radio,
  RefreshCw,
  ShoppingBag,
  Calculator,
  Compass,
  DollarSign,
  CalendarCheck,
  Check,
} from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  soundFeedback,
  tts,
  VoiceState,
  VoiceCommandResult,
} from '../utils/voiceAssistant';
import { PartyPlan, ShoppingItem } from '../types';

interface VoiceAssistantHUDProps {
  currentPlan: PartyPlan;
  currentTab: 'shopping' | 'timeline' | 'budget';
  openModalName: string;
  onExecuteCommand: (action: string, params: any, spokenResponse: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const VOICE_CHIP_SUGGESTIONS = [
  '🎙️ "Add 3 bags of party ice"',
  '🛒 "Switch all to Cymbal Choice"',
  '🍹 "Calculate drinks for 20 guests"',
  '📍 "Where is the deli counter?"',
  '📅 "Show party prep timeline"',
  '💲 "Auto align to target budget"',
  '🛍️ "Open curbside checkout"',
  '✅ "Mark all items purchased"',
];

export const VoiceAssistantHUD: React.FC<VoiceAssistantHUDProps> = ({
  currentPlan,
  currentTab,
  openModalName,
  onExecuteCommand,
  isOpen,
  onClose,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [continuousHandsFree, setContinuousHandsFree] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>(
    'Hands-Free Voice is ready! Say a command like "Add 2 packs of buns" or "Calculate drinks for 20 guests".'
  );
  const [lastExecutedAction, setLastExecutedAction] = useState<string | null>(null);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const continuousRef = useRef<boolean>(continuousHandsFree);
  const isSpeakingRef = useRef<boolean>(false);

  continuousRef.current = continuousHandsFree;

  // Initialize Speech Recognition
  const initRecognition = useCallback(() => {
    if (!isSpeechRecognitionSupported()) return null;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.continuous = false; // We manage restarts manually to avoid browser buffer locks
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      isListeningRef.current = true;
      setVoiceState('listening');
      soundFeedback.playStartListening();
    };

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim);
      if (finalTranscript) {
        setTranscript(finalTranscript);
        setInterimTranscript('');
        processVoiceCommand(finalTranscript);
      }
    };

    rec.onerror = (event: any) => {
      console.warn('Speech recognition event error:', event.error);
      if (event.error === 'no-speech') {
        if (continuousRef.current && !isSpeakingRef.current) {
          setTimeout(() => startListening(), 400);
        } else {
          setVoiceState('idle');
          isListeningRef.current = false;
        }
      } else if (event.error === 'not-allowed') {
        setVoiceState('error');
        setAssistantReply('Microphone permission was denied. Please allow microphone access in your browser.');
        isListeningRef.current = false;
      } else {
        setVoiceState('idle');
        isListeningRef.current = false;
      }
    };

    rec.onend = () => {
      isListeningRef.current = false;
      if (voiceState === 'listening') {
        setVoiceState('idle');
      }
    };

    return rec;
  }, []);

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setAssistantReply('Speech recognition is not supported in this browser. You can type commands below!');
      return;
    }

    if (isListeningRef.current) return;

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }
      tts.stop();
      recognitionRef.current.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      try {
        recognitionRef.current = initRecognition();
        recognitionRef.current.start();
      } catch (err) {
        setVoiceState('idle');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    isListeningRef.current = false;
    setVoiceState('idle');
  };

  const toggleListening = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  // Process command via server AI endpoint with fallback
  const processVoiceCommand = async (cmdText: string) => {
    if (!cmdText.trim()) return;
    setIsProcessing(true);
    setVoiceState('processing');

    try {
      const response = await fetch('/api/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmdText,
          currentPlan,
          currentView: currentTab,
          openModal: openModalName,
        }),
      });

      const data: VoiceCommandResult = await response.json();
      soundFeedback.playSuccess();

      const spoken = data.spokenResponse || 'Understood.';
      setAssistantReply(spoken);
      setLastExecutedAction(data.action || 'EXECUTE');

      // Execute action callback in React state
      onExecuteCommand(data.action, data.params || {}, spoken);

      // Speak response aloud via Text-to-Speech
      isSpeakingRef.current = true;
      setVoiceState('speaking');

      tts.speak(spoken, () => {
        isSpeakingRef.current = false;
        setVoiceState('idle');
        // If continuous hands-free is enabled, resume listening after speaking!
        if (continuousRef.current && isOpen) {
          setTimeout(() => {
            if (!isListeningRef.current && continuousRef.current) {
              startListening();
            }
          }, 600);
        }
      });
    } catch (err) {
      console.error('Error executing voice command:', err);
      setAssistantReply('Sorry, I had trouble processing that voice command.');
      setVoiceState('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const text = textInput;
    setTextInput('');
    setTranscript(text);
    processVoiceCommand(text);
  };

  // Keyboard shortcut listener: Press 'v' or 'V' to toggle voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when focused in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState]);

  // Auto-start listening when HUD opens if supported
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (!isListeningRef.current) {
          startListening();
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      stopListening();
      tts.stop();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="voice-assistant-hud-container"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl transition-all duration-300 font-sans"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border-2 border-emerald-500/80 overflow-hidden">
        {/* Top Mini Header */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              {voiceState === 'listening' && (
                <span className="w-4 h-4 rounded-full bg-emerald-400/40 absolute -top-0.5 -left-0.5 animate-ping" />
              )}
            </div>
            <span className="text-xs font-black tracking-wide text-emerald-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              CymbalMart Hands-Free Voice Control
            </span>
            <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-extrabold hidden sm:inline">
              HOTKEY [V]
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Continuous Hands-Free Switch */}
            <button
              id="btn-voice-continuous-toggle"
              onClick={() => setContinuousHandsFree(!continuousHandsFree)}
              title={
                continuousHandsFree
                  ? 'Continuous Hands-Free ON: Keeps listening after replies'
                  : 'Continuous Hands-Free OFF: Push to talk'
              }
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                continuousHandsFree
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Radio className={`w-3 h-3 ${continuousHandsFree ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{continuousHandsFree ? 'Continuous: ON' : 'Continuous: OFF'}</span>
            </button>

            {/* Mute TTS Audio */}
            <button
              id="btn-voice-mute-tts"
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                tts.enabled = !next;
                if (next) tts.stop();
              }}
              title={isMuted ? 'Unmute Audio Speech Responses' : 'Mute Audio Speech Responses'}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-all"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Cheat Sheet Toggle */}
            <button
              id="btn-voice-cheatsheet-toggle"
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              title="Voice Commands Guide"
              className="p-1 text-slate-300 hover:text-amber-300 rounded hover:bg-slate-800 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800"
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        {!isMinimized && (
          <div className="p-3.5 space-y-2.5">
            {/* Live Audio Visualizer & Speaking Banner */}
            <div className="flex items-center gap-3 bg-slate-800/80 rounded-xl p-2.5 border border-slate-700">
              {/* Primary Mic Button */}
              <button
                id="btn-voice-mic-main"
                onClick={toggleListening}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0 ${
                  voiceState === 'listening'
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/50 scale-105 animate-pulse ring-4 ring-emerald-400/30'
                    : voiceState === 'processing'
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/50 animate-spin'
                    : voiceState === 'speaking'
                    ? 'bg-indigo-500 text-white shadow-indigo-500/50 ring-4 ring-indigo-400/30'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
                title="Click or press 'V' to start speaking hands-free"
              >
                {voiceState === 'listening' ? (
                  <Mic className="w-6 h-6" />
                ) : voiceState === 'processing' ? (
                  <RefreshCw className="w-6 h-6" />
                ) : voiceState === 'speaking' ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6 text-slate-400" />
                )}
              </button>

              {/* Status and Active Wave Visualizer */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold tracking-wide uppercase text-slate-300">
                      {voiceState === 'listening'
                        ? '🎙️ Listening to customer...'
                        : voiceState === 'processing'
                        ? '⚡ AI Analyzing Command...'
                        : voiceState === 'speaking'
                        ? '🗣️ Assistant Speaking...'
                        : '⏸️ Mic Paused (Press V or Click Mic)'}
                    </span>
                  </div>

                  {/* Audio visual frequency bars simulation */}
                  <div className="flex items-end gap-0.5 h-3.5 px-2">
                    {[40, 75, 100, 60, 90, 45, 80, 50, 95, 30].map((h, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-150 ${
                          voiceState === 'listening'
                            ? 'bg-emerald-400'
                            : voiceState === 'speaking'
                            ? 'bg-indigo-400'
                            : 'bg-slate-600'
                        }`}
                        style={{
                          height:
                            voiceState === 'listening' || voiceState === 'speaking'
                              ? `${Math.max(20, (h * Math.sin(Date.now() / 200 + i)) % 100)}%`
                              : '25%',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Live Heard Transcript Preview */}
                <div className="mt-1 min-h-[22px] flex items-center">
                  {transcript || interimTranscript ? (
                    <p className="text-xs font-semibold text-emerald-200 truncate">
                      <span className="text-slate-400 font-normal">Heard: </span>"
                      {interimTranscript || transcript}"
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic truncate">
                      Speak any grocery item, budget instruction, drink math, or aisle question...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Assistant Spoken Response Bubble */}
            <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-xl p-2.5 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-indigo-950 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">
                CM
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    CymbalMart Voice Assistant
                  </span>
                  {lastExecutedAction && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/90 text-emerald-200 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      {lastExecutedAction}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-100 mt-0.5 leading-relaxed">
                  {assistantReply}
                </p>
              </div>
            </div>

            {/* Quick Command Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">
                Try saying:
              </span>
              {VOICE_CHIP_SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const clean = chip.replace(/^[^\w"]+|"/g, '').replace(/"$/, '');
                    setTranscript(clean);
                    processVoiceCommand(clean);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 whitespace-nowrap shrink-0 transition-all text-xs font-medium"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Text Fallback Input Bar */}
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type voice command hands-free (e.g. 'Add 2 cases of seltzers to aisle 8')..."
                className="flex-1 bg-slate-800 text-white placeholder-slate-400 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-400"
              />
              <button
                type="submit"
                disabled={isProcessing || !textInput.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>Execute</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Voice Commands Cheat Sheet Modal */}
      {showCheatSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl max-w-xl w-full p-5 text-white shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Complete Hands-Free Voice Commands Guide
                  </h3>
                  <p className="text-xs text-emerald-300">
                    Control every step of your CymbalMart party shopping without touching the screen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCheatSheet(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Command Categories */}
            <div className="space-y-3.5 text-xs">
              {/* Category 1 */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                <span className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1.5 mb-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> 1. Shopping List Management
                </span>
                <ul className="space-y-1 text-slate-300 pl-2">
                  <li>• <strong className="text-white">"Add 3 bags of tortilla chips"</strong> — Adds item with quantity & store mapping</li>
                  <li>• <strong className="text-white">"Add 2 cases of craft beer for 14 dollars"</strong> — Adds to beverages aisle</li>
                  <li>• <strong className="text-white">"Remove fairy lights"</strong> — Deletes item from your shopping list</li>
                  <li>• <strong className="text-white">"Mark charcuterie board as bought"</strong> — Toggles item purchased checkmark</li>
                  <li>• <strong className="text-white">"Mark all items as purchased"</strong> — Marks entire list checked off</li>
                  <li>• <strong className="text-white">"Show only drinks"</strong> or <strong className="text-white">"Show bakery"</strong> — Filters view to store department</li>
                </ul>
              </div>

              {/* Category 2 */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> 2. Budget & Cymbal Choice Brand Savings
                </span>
                <ul className="space-y-1 text-slate-300 pl-2">
                  <li>• <strong className="text-white">"Switch all items to Cymbal Choice"</strong> — Swaps brands to save ~22%</li>
                  <li>• <strong className="text-white">"Auto align to target budget"</strong> — Optimizes cart to fit budget ceiling</li>
                  <li>• <strong className="text-white">"Open budget optimizer"</strong> — Displays AI cost-cutting strategies</li>
                  <li>• <strong className="text-white">"How much have I spent?"</strong> — Assistant speaks your current cart total & balance</li>
                </ul>
              </div>

              {/* Category 3 */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                <span className="text-[11px] font-black uppercase text-cyan-400 flex items-center gap-1.5 mb-1.5">
                  <Calculator className="w-3.5 h-3.5" /> 3. Beverage & Food Portion Formulas
                </span>
                <ul className="space-y-1 text-slate-300 pl-2">
                  <li>• <strong className="text-white">"Calculate drinks for 20 guests for 4 hours"</strong> — Speaks bottles & cans math</li>
                  <li>• <strong className="text-white">"How much ice do I need?"</strong> — Calculates ice lbs formula</li>
                  <li>• <strong className="text-white">"Show signature punch recipe"</strong> — Opens batch recipe scaler</li>
                  <li>• <strong className="text-white">"Add recipe ingredients to cart"</strong> — Imports recipe items directly</li>
                </ul>
              </div>

              {/* Category 4 */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                <span className="text-[11px] font-black uppercase text-purple-400 flex items-center gap-1.5 mb-1.5">
                  <Compass className="w-3.5 h-3.5" /> 4. In-Store Navigation & Aisle Finder
                </span>
                <ul className="space-y-1 text-slate-300 pl-2">
                  <li>• <strong className="text-white">"Where is the deli counter?"</strong> — Reads Aisle 7 instructions</li>
                  <li>• <strong className="text-white">"Which aisle has paper plates?"</strong> — Reads Aisle 9 details</li>
                  <li>• <strong className="text-white">"Open in-store mode"</strong> — Activates mobile in-store aisle check-off</li>
                </ul>
              </div>

              {/* Category 5 */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                <span className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1.5 mb-1.5">
                  <CalendarCheck className="w-3.5 h-3.5" /> 5. Timeline, Schedule & Checkout
                </span>
                <ul className="space-y-1 text-slate-300 pl-2">
                  <li>• <strong className="text-white">"Show prep timeline"</strong> — Switches to party prep schedule</li>
                  <li>• <strong className="text-white">"Open checkout"</strong> — Opens Refine & Checkout for delivery/curbside</li>
                  <li>• <strong className="text-white">"Load Summer BBQ preset"</strong> — Loads preset event plan</li>
                  <li>• <strong className="text-white">"Close modal"</strong> — Dismisses open dialogs</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCheatSheet(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
              >
                Got It, Start Hands-Free Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
