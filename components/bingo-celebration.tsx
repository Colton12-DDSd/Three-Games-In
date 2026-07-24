"use client";
import { useEffect } from "react";

function playFanfare() {
  try {
    const Audio =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Audio) return;
    const context = new Audio();
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator(),
        gain = context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = "triangle";
      gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.11);
      gain.gain.exponentialRampToValueAtTime(
        0.12,
        context.currentTime + index * 0.11 + 0.02,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + index * 0.11 + 0.28,
      );
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + index * 0.11);
      oscillator.stop(context.currentTime + index * 0.11 + 0.3);
    });
  } catch {
    /* Browser sound permissions can block an automatic celebration. */
  }
}
export function BingoCelebration({
  winner,
  label,
  dismiss,
}: {
  winner: string;
  label: string;
  dismiss: () => void;
}) {
  useEffect(() => {
    playFanfare();
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Bingo celebration"
    >
      <div className="celebrate w-full max-w-md rounded-3xl border border-mint/50 bg-gradient-to-br from-[#213c4b] to-[#302451] p-9 text-center shadow-2xl">
        <p className="text-5xl" aria-hidden>
          ✦ ✦ ✦
        </p>
        <p className="mt-6 text-sm font-black tracking-[.25em] text-mint">
          WE HAVE A WINNER
        </p>
        <h2 className="mt-2 text-5xl font-black">{label}</h2>
        <p className="mt-3 text-xl text-slate-200">{winner} got there first.</p>
        <button autoFocus className="btn btn-primary mt-8" onClick={dismiss}>
          Keep playing
        </button>
      </div>
    </div>
  );
}
