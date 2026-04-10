let audioContext = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

function tone(ctx, options) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = options.type || 'sine';
  oscillator.frequency.setValueAtTime(options.from, ctx.currentTime);
  if (options.to) {
    oscillator.frequency.exponentialRampToValueAtTime(options.to, ctx.currentTime + options.duration);
  }
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(options.volume || 0.05, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + options.duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + options.duration + 0.03);
}

export function playUiSound(kind) {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    if (kind === 'room-enter') {
      tone(ctx, { from: 520, to: 780, duration: 0.12, volume: 0.035, type: 'triangle' });
      setTimeout(() => tone(ctx, { from: 780, to: 980, duration: 0.09, volume: 0.025, type: 'triangle' }), 70);
      return;
    }

    if (kind === 'voice-join') {
      tone(ctx, { from: 420, to: 640, duration: 0.16, volume: 0.04, type: 'sine' });
      setTimeout(() => tone(ctx, { from: 640, to: 860, duration: 0.11, volume: 0.03, type: 'sine' }), 90);
      return;
    }

    if (kind === 'member-join') {
      tone(ctx, { from: 460, to: 620, duration: 0.09, volume: 0.028, type: 'triangle' });
      return;
    }

    if (kind === 'message-in') {
      tone(ctx, { from: 680, to: 540, duration: 0.08, volume: 0.02, type: 'triangle' });
      return;
    }

    tone(ctx, { from: 500, to: 700, duration: 0.08, volume: 0.02, type: 'triangle' });
  } catch {}
}
