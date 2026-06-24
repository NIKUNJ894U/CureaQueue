/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class VoiceAnnouncer {
  private synth: SpeechSynthesis;
  private utterances: SpeechSynthesisUtterance[] = [];
  private isSpeaking: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  /**
   * Cancel all pending speech utterances
   */
  cancel(): void {
    this.synth.cancel();
    this.utterances = [];
    this.isSpeaking = false;
  }

  /**
   * Check if voice synthesis is available
   */
  isAvailable(): boolean {
    return !!this.synth;
  }

  /**
   * Announce token call with natural voice
   * Example: "Token 42, please proceed to Cabin 1"
   */
  announceToken(
    tokenNumber: number,
    patientName: string,
    cabin?: string,
    language: string = 'en-US'
  ): void {
    if (!this.isAvailable()) {
      console.warn('Speech Synthesis not available');
      return;
    }

    this.cancel(); // Cancel any previous announcements

    const cabinText = cabin ? ` to ${cabin}` : '';
    const text = `Token ${tokenNumber}, ${patientName}, please proceed${cabinText}.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 0.9;

    this.utterances.push(utterance); // Keep reference to prevent GC

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.utterances = this.utterances.filter(u => u !== utterance); // Clean up reference
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      this.utterances = this.utterances.filter(u => u !== utterance); // Clean up reference
    };

    // Workaround for Chrome SpeechSynthesis freeze
    if (this.synth.paused) {
      this.synth.resume();
    }
    this.synth.speak(utterance);
  }

  /**
   * Play emergency alert with distinctive voice pattern
   */
  playEmergencyAlert(patientName: string, language: string = 'en-US'): void {
    if (!this.isAvailable()) return;

    this.cancel();

    // Two-part alert: first high pitch for attention, then normal voice
    const texts = [
      `EMERGENCY ALERT`,
      `${patientName}, proceed immediately to Cabin 1`,
    ];

    texts.forEach((text, index) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;

      if (index === 0) {
        // First alert - higher pitch, faster
        utterance.pitch = 1.5;
        utterance.rate = 1.1;
        utterance.volume = 1;
      } else {
        // Second - normal
        utterance.pitch = 1;
        utterance.rate = 0.9;
      }

      this.utterances.push(utterance); // Keep reference to prevent GC

      utterance.onend = () => {
        this.utterances = this.utterances.filter(u => u !== utterance); // Clean up reference
        if (index === texts.length - 1) {
          this.isSpeaking = false;
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        this.utterances = this.utterances.filter(u => u !== utterance); // Clean up reference
        this.isSpeaking = false;
      };

      if (index === 0) {
        this.isSpeaking = true;
      }

      this.synth.speak(utterance);
    });
  }

  /**
   * Announce system message (e.g., "Queue is full")
   */
  announceMessage(message: string, language: string = 'en-US'): void {
    if (!this.isAvailable()) return;

    this.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = language;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    this.utterances.push(utterance); // Keep reference to prevent GC

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.utterances = this.utterances.filter(u => u !== utterance); // Clean up
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      this.utterances = this.utterances.filter(u => u !== utterance); // Clean up
    };

    if (this.synth.paused) {
      this.synth.resume();
    }
    this.synth.speak(utterance);
  }

  /**
   * Check if currently speaking
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking || this.synth.speaking;
  }
}

// Singleton instance
export const voiceAnnouncer = new VoiceAnnouncer();
