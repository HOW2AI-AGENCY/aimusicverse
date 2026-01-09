/**
 * Sound Effects Engine for Gamification
 * Uses Web Audio API for lightweight, synthesized sounds
 * 
 * LAZY INITIALIZATION: The SoundEffects instance is NOT created at module load.
 * Call getSoundEffects() to get the singleton instance when needed.
 */
import { logger } from '@/lib/logger';
import { createAudioContext } from '@/lib/audio/audioContextHelper';

class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = createAudioContext();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('soundEffectsEnabled', String(enabled));
  }

  isEnabled(): boolean {
    const stored = localStorage.getItem('soundEffectsEnabled');
    if (stored !== null) {
      this.enabled = stored === 'true';
    }
    return this.enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.isEnabled()) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      logger.warn('Sound effect failed', { error: e });
    }
  }

  private playChord(frequencies: number[], duration: number, type: OscillatorType = 'sine', volume: number = 0.15) {
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, duration, type, volume), i * 50);
    });
  }

  // Reward sounds
  creditEarned() {
    this.playTone(880, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.2), 80);
  }

  xpEarned() {
    this.playTone(660, 0.1, 'triangle', 0.15);
    setTimeout(() => this.playTone(880, 0.15, 'triangle', 0.15), 60);
  }

  levelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.25), i * 100);
    });
  }

  achievementUnlock() {
    // Triumphant fanfare
    this.playChord([523.25, 659.25, 783.99], 0.4, 'sine', 0.2);
    setTimeout(() => {
      this.playChord([587.33, 739.99, 880], 0.4, 'sine', 0.2);
    }, 200);
    setTimeout(() => {
      this.playChord([659.25, 830.61, 1046.50], 0.5, 'sine', 0.25);
    }, 400);
  }

  checkinSuccess() {
    this.playTone(440, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(554.37, 0.1, 'sine', 0.2), 100);
    setTimeout(() => this.playTone(659.25, 0.2, 'sine', 0.25), 200);
  }

  streakBonus() {
    const notes = [392, 440, 493.88, 523.25]; // G4, A4, B4, C5
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'triangle', 0.2), i * 80);
    });
  }

  missionComplete() {
    this.playTone(523.25, 0.15, 'square', 0.15);
    setTimeout(() => this.playTone(659.25, 0.15, 'square', 0.15), 100);
    setTimeout(() => this.playTone(783.99, 0.25, 'square', 0.2), 200);
  }

  // UI interaction sounds
  buttonClick() {
    this.playTone(1000, 0.05, 'sine', 0.1);
  }

  toggleOn() {
    this.playTone(800, 0.08, 'sine', 0.15);
    setTimeout(() => this.playTone(1000, 0.08, 'sine', 0.15), 50);
  }

  toggleOff() {
    this.playTone(1000, 0.08, 'sine', 0.15);
    setTimeout(() => this.playTone(800, 0.08, 'sine', 0.15), 50);
  }

  error() {
    this.playTone(200, 0.15, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.1), 100);
  }

  success() {
    this.playTone(523.25, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(783.99, 0.15, 'sine', 0.2), 100);
  }

  notification() {
    this.playTone(880, 0.1, 'sine', 0.15);
    setTimeout(() => this.playTone(1174.66, 0.15, 'sine', 0.15), 100);
  }
}

// Lazy singleton - instance is NOT created at module load
let _soundEffectsInstance: SoundEffects | null = null;

/**
 * Get the sound effects singleton instance.
 * The instance is created lazily on first call to prevent
 * AudioContext initialization at module load time.
 */
export function getSoundEffects(): SoundEffects {
  if (!_soundEffectsInstance) {
    _soundEffectsInstance = new SoundEffects();
  }
  return _soundEffectsInstance;
}
