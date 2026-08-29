// Web Audio and Web Speech Assistant Engine for Hands-Free Voice Control

export interface VoiceCommandResult {
  spokenResponse: string;
  action: string;
  params: any;
  rawTranscript: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

// Check browser support for Web Speech Recognition
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

// Check browser support for Web Speech Synthesis
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Sound effects using Web Audio API for hands-free audio cues
class SoundFeedback {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playStartListening() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // Audio autoplay might be blocked before first interaction
    }
  }

  playSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {
      // Silent catch
    }
  }
}

export const soundFeedback = new SoundFeedback();

// Text-to-Speech Engine
export class TextToSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  public enabled: boolean = true;
  public rate: number = 1.05;

  constructor() {
    if (isSpeechSynthesisSupported()) {
      this.synth = window.speechSynthesis;
      this.loadVoice();
      if (typeof window !== 'undefined' && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoice();
      }
    }
  }

  private loadVoice() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prefer natural English voices (Google, Samantha, Karen, Daniel, etc.)
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Karen') ||
          v.name.includes('US English'))
    ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

    if (preferred) {
      this.voice = preferred;
    }
  }

  speak(text: string, onEnd?: () => void): void {
    if (!this.enabled || !this.synth) {
      onEnd?.();
      return;
    }

    try {
      this.synth.cancel(); // Stop any ongoing speech
      // Clean markdown tags (*, #, _, etc.) for cleaner natural reading
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#+\s+/g, '')
        .replace(/•/g, ', ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = this.rate;
      utterance.pitch = 1.02;

      utterance.onend = () => {
        onEnd?.();
      };
      utterance.onerror = (e) => {
        console.warn('TTS error:', e);
        onEnd?.();
      };

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Failed to speak text:', e);
      onEnd?.();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const tts = new TextToSpeechEngine();
