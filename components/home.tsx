"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CARD_SETS, CardSetKey } from "@/lib/prompts";
type Saved = {
  playerId: string;
  playerSecret: string;
  name: string;
  roomCode: string;
};
export function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [cardSet, setCardSet] = useState<CardSetKey>("arenas");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const raw = localStorage.getItem("three-games-in");
    if (raw) {
      try {
        setName((JSON.parse(raw) as Saved).name);
      } catch {}
    }
  }, []);
  async function submit(event: FormEvent, intent: "create" | "join") {
    event.preventDefault();
    setError("");
    setBusy(intent);
    try {
      const old = JSON.parse(
        localStorage.getItem("three-games-in") || "null",
      ) as Saved | null;
      const r = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intent,
          name,
          roomCode: code,
          cardSet,
          playerId: old?.playerId,
          playerSecret: old?.playerSecret,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      localStorage.setItem(
        "three-games-in",
        JSON.stringify({
          playerId: data.playerId,
          playerSecret: data.playerSecret,
          name,
          roomCode: data.roomCode,
        }),
      );
      router.push(`/room/${data.roomCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <main className="mx-auto grid min-h-screen max-w-5xl place-items-center p-5">
      <section className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-2xl md:grid-cols-[1.2fr_1fr]">
        <div className="p-8 md:p-12">
          <p className="text-sm font-black tracking-[.25em] text-mint">
            GAME NIGHT BINGO
          </p>
          <h1 className="mt-4 text-5xl font-black leading-none sm:text-6xl">
            Three
            <br />
            <span className="text-violet">Games In.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-300">
            A no-fuss, shared bingo board for the moments nobody can make up.
          </p>
          <div className="mt-10 flex gap-3 text-sm text-slate-400">
            <span>4×4 cards</span>
            <span>•</span>
            <span>Live progress</span>
            <span>•</span>
            <span>One winner</span>
          </div>
        </div>
        <div className="border-t border-white/10 bg-black/10 p-6 md:border-l md:border-t-0 md:p-10">
          <form onSubmit={(e) => submit(e, "create")} className="space-y-4">
            <label className="block text-sm font-bold">
              Your display name
              <input
                required
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-ink px-4 py-3"
                placeholder="e.g. Colton"
              />
            </label>
            <fieldset>
              <legend className="text-sm font-bold">Bingo card</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(Object.keys(CARD_SETS) as CardSetKey[]).map((key) => (
                  <button
                    type="button"
                    onClick={() => setCardSet(key)}
                    aria-pressed={cardSet === key}
                    key={key}
                    className={`rounded-xl border px-2 py-3 text-sm font-black ${cardSet === key ? "border-mint bg-mint/15 text-mint" : "border-white/10 bg-ink text-slate-300"}`}
                  >
                    {CARD_SETS[key].label}
                  </button>
                ))}
              </div>
            </fieldset>
            <button disabled={!!busy} className="btn btn-primary w-full">
              {busy === "create" ? "Creating room…" : "Create a room"}
            </button>
          </form>
          <div className="my-7 flex items-center gap-3 text-xs font-bold tracking-widest text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            OR JOIN
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <form onSubmit={(e) => submit(e, "join")} className="space-y-4">
            <label className="block text-sm font-bold">
              Room code
              <input
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-2 w-full rounded-xl border border-white/10 bg-ink px-4 py-3 uppercase tracking-[.25em]"
                placeholder="ABC123"
              />
            </label>
            <button disabled={!!busy} className="btn btn-secondary w-full">
              {busy === "join" ? "Joining room…" : "Join room"}
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-4 text-sm text-rose-300">
              {error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
