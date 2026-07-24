"use client";
function tone(notes: number[], type: OscillatorType, volume: number) {
  try {
    const Audio =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Audio) return;
    const context = new Audio();
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator(),
        gain = context.createGain(),
        start = context.currentTime + index * 0.055;
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.115);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.13);
    });
  } catch {}
}
export const playOwnMark = () => tone([587.33], "sine", 0.06);
export const playRemoteMark = () => tone([196, 783.99, 196], "square", 0.1);
