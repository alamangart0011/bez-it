let audioContext = null;

function getContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  return audioContext;
}

function scheduleTone(ctx, { frequency, start, duration, gain = 0.035, type = 'sine' }) {
  const oscillator = ctx.createOscillator();
  const volume = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  volume.gain.setValueAtTime(0.0001, start);
  volume.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(volume);
  volume.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

const soundMap = {
  message: [
    { frequency: 660, duration: 0.07, gain: 0.028, type: 'triangle' },
    { frequency: 880, duration: 0.09, gain: 0.022, type: 'triangle', offset: 0.08 }
  ],
  join: [
    { frequency: 523.25, duration: 0.08, gain: 0.03, type: 'sine' },
    { frequency: 659.25, duration: 0.1, gain: 0.025, type: 'sine', offset: 0.09 }
  ],
  leave: [
    { frequency: 659.25, duration: 0.08, gain: 0.026, type: 'sine' },
    { frequency: 415.3, duration: 0.12, gain: 0.022, type: 'sine', offset: 0.08 }
  ],
  alert: [
    { frequency: 740, duration: 0.09, gain: 0.03, type: 'square' },
    { frequency: 587, duration: 0.09, gain: 0.024, type: 'square', offset: 0.1 },
    { frequency: 740, duration: 0.12, gain: 0.03, type: 'square', offset: 0.22 }
  ]
};

export function playUiSound(kind = 'message', enabled = true) {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => undefined);
  }
  const pattern = soundMap[kind] || soundMap.message;
  const base = ctx.currentTime + 0.01;
  pattern.forEach((tone) => scheduleTone(ctx, { ...tone, start: base + (tone.offset || 0) }));
}
