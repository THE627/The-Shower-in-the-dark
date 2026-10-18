/**
 * Comprehensive Procedural Web Audio Engine
 * Zero external audio files; all synthesized via Web Audio API nodes.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private showerSource: AudioBufferSourceNode | null = null;
  private showerGain: GainNode | null = null;
  private musicInterval: number | null = null;
  private initialized: boolean = false;

  public init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initialized = true;
      this.startDrone();
      this.startAmbientMelody();
    } catch {
      // AudioContext not supported or blocked
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx) {
      if (muted && this.ctx.state === 'running') {
        this.ctx.suspend();
      } else if (!muted && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous eerie ambient horror drone
   * Fixes the previous unscoped osc2 leak!
   */
  private startDrone() {
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.08, now);
      this.droneGain = droneGain;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(110, now);

      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(45.0, now);

      const osc2 = this.ctx.createOscillator(); // Properly scoped with const!
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(48.5, now);

      osc1.connect(lowpass);
      osc2.connect(lowpass);
      lowpass.connect(droneGain);
      droneGain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();

      this.droneOsc1 = osc1;
      this.droneOsc2 = osc2;
    } catch {
      // Audio node failure fallback
    }
  }

  /**
   * Procedural horror tiptoe piano arpeggios
   */
  private startAmbientMelody() {
    if (this.musicInterval) return;

    const notes = [220, 233.08, 261.63, 277.18, 329.63, 349.23, 440, 466.16]; // A minor / diminished eerie scale

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || this.ctx.state !== 'running') return;
      if (Math.random() > 0.4) {
        const note = notes[Math.floor(Math.random() * notes.length)];
        this.playPianoNote(note, 0.4 + Math.random() * 0.4);
      }
    }, 1800);
  }

  private playPianoNote(freq: number, duration: number) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Shower water rushing sound (procedural white noise)
   */
  public setShowerSound(active: boolean) {
    if (!this.ctx || this.isMuted) return;

    if (active) {
      if (this.showerSource) return;

      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 1.2);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      source.start();
      this.showerSource = source;
      this.showerGain = gain;
    } else {
      if (this.showerGain && this.showerSource) {
        const now = this.ctx.currentTime;
        this.showerGain.gain.linearRampToValueAtTime(0.001, now + 0.6);
        setTimeout(() => {
          try {
            this.showerSource?.stop();
            this.showerSource?.disconnect();
          } catch {}
          this.showerSource = null;
          this.showerGain = null;
        }, 700);
      }
    }
  }

  /**
   * Knife swing whoosh
   */
  public playKnifeSwing() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Knife blade hit impact
   */
  public playKnifeHit() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Door Knocking (3 percussive wood knocks)
   */
  public playDoorKnock() {
    if (!this.ctx || this.isMuted) return;

    const knockTimes = [0, 0.22, 0.44];
    knockTimes.forEach((delay) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
      }, delay * 1000);
    });
  }

  /**
   * Treat Candy Chimes (Sparkling pentatonic arpeggio)
   */
  public playTreatChime() {
    if (!this.ctx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
      }, idx * 80);
    });
  }

  /**
   * J*b Jumpscare / Stinger chord
   */
  public playHorrorStinger() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const freqs = [110, 116.54, 155.56, 233.08]; // Dissonant cluster
    freqs.forEach((f) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  }

  /**
   * Laser Warning & Beam Sound
   */
  public playLaserWarning() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.setValueAtTime(880, now + 0.1);
    osc.frequency.setValueAtTime(700, now + 0.2);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playLaserFire() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  /**
   * Player hurt sound
   */
  public playHurt() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Footstep sound
   */
  public playFootstep() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.06);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Grass rustle / eruption sound
   */
  public playGrassRustle() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    source.start(now);
  }

  /**
   * Voice synthesis for corporate boss dialogue
   */
  public speakCorporate(text: string, pitch = 0.8, rate = 0.95) {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis blocked or unavailable
    }
  }

  public dispose() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.showerSource) {
      try {
        this.showerSource.stop();
      } catch {}
      this.showerSource = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
    this.initialized = false;
  }
}

export const sound = new SoundEngine();
