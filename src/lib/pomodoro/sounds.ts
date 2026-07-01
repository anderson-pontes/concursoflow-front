function getAudioCtx() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctx();
}

function playNote(ctx: AudioContext, freq: number, startTime: number, duration: number, gainPeak = 0.35) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.03);
  gain.gain.setValueAtTime(gainPeak, startTime + duration - 0.06);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playBeep() {
  try {
    const ctx = getAudioCtx();
    playNote(ctx, 880, ctx.currentTime, 0.28);
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* ambiente sem áudio */
  }
}

export function playCompletionSound() {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const notes = [329.63, 392.0, 493.88, 659.25];
    notes.forEach((freq, i) => {
      playNote(ctx, freq, t + i * 0.18, 0.55, 0.3);
    });
    playNote(ctx, 659.25, t + notes.length * 0.18, 0.9, 0.2);
    setTimeout(() => ctx.close(), 3000);
  } catch {
    /* ambiente sem áudio */
  }
}
