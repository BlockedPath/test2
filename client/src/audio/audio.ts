/**
 * Minimal Web Audio manager per #13: ≤6 concurrent, distance-attenuated by 120m, no 3D panning v1.
 * Uses oscillator stubs so no asset files are required for scaffold; replace with samples later.
 */
export type SoundKind = "shoot_ar" | "shoot_sg" | "shoot_sr" | "hit" | "death" | "footstep" | "zone";

export class AudioManager {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private muted = localStorage.getItem("br_muted") === "1";
  private active = 0;
  private readonly maxConcurrent = 6;

  ensure(): void {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = this.muted ? 0 : 0.25;
    this.gain.connect(this.ctx.destination);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem("br_muted", this.muted ? "1" : "0");
    if (this.gain) this.gain.gain.value = this.muted ? 0 : 0.25;
    return this.muted;
  }

  play(kind: SoundKind, distance?: number): void {
    if (this.muted) return;
    if (this.active >= this.maxConcurrent) return;
    this.ensure();
    if (!this.ctx || !this.gain) return;
    // distance attenuation by 120m cone caps (§7) — simple linear
    let vol = 1;
    if (typeof distance === "number") {
      vol = Math.max(0, 1 - distance / 120);
    }
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const freq =
      kind === "shoot_ar" ? 180 : kind === "shoot_sg" ? 90 : kind === "shoot_sr" ? 320 : kind === "hit" ? 440 : kind === "footstep" ? 80 : 60;
    osc.frequency.value = freq;
    osc.type = kind.startsWith("shoot") ? "square" : "sine";
    g.gain.value = vol * 0.3;
    osc.connect(g).connect(this.gain!);
    osc.start();
    this.active += 1;
    const dur = kind === "shoot_sg" ? 0.12 : kind === "footstep" ? 0.08 : 0.15;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.stop(this.ctx.currentTime + dur);
    osc.onended = () => {
      this.active = Math.max(0, this.active - 1);
      osc.disconnect();
      g.disconnect();
    };
  }
}
