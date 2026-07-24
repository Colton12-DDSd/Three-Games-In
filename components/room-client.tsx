"use client";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BingoCard } from "@/components/bingo-card";
import { PlayerList } from "@/components/player-list";
import { BingoCelebration } from "@/components/bingo-celebration";
import { RoomPayload } from "@/lib/types";
import { CARD_SETS, WIN_CONDITIONS, WinCondition } from "@/lib/prompts";
import { playOwnMark, playRemoteMark } from "@/lib/sounds";
type Saved = {
  playerId: string;
  playerSecret: string;
  name: string;
  roomCode: string;
};
const statusText: Record<string, string> = {
  waiting: "Waiting for the host to start",
  active: "Round active",
  bingo: "Bingo achieved",
  ended: "Round ended",
  reset: "Room reset",
};
export function RoomClient({ roomCode }: { roomCode: string }) {
  const [data, setData] = useState<RoomPayload | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [celebration, setCelebration] = useState<string | null>(null),
    [copied, setCopied] = useState(false),
    [nextCardSet, setNextCardSet] = useState<keyof typeof CARD_SETS>("arenas"),
    [nextWinCondition, setNextWinCondition] = useState<WinCondition>("line"),
    saved = useRef<Saved | null>(null),
    heardEvent = useRef<string | null>(null),
    channel = useRef<ReturnType<
      ReturnType<typeof createClient>["channel"]
    > | null>(null);
  const reload = useCallback(
    async (quiet = false) => {
      const s = saved.current;
      if (!s) return;
      if (!quiet) setLoading(true);
      try {
        const r = await fetch(
          `/api/rooms/${roomCode}?playerId=${encodeURIComponent(s.playerId)}&playerSecret=${encodeURIComponent(s.playerSecret)}`,
          { cache: "no-store" },
        );
        const json = await r.json();
        if (!r.ok) throw new Error(json.error);
        setData(json);
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Connection lost. Retrying…");
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [roomCode],
  );
  useEffect(() => {
    const raw = localStorage.getItem("three-games-in");
    if (!raw) {
      location.assign("/");
      return;
    }
    try {
      saved.current = JSON.parse(raw);
    } catch {
      location.assign("/");
      return;
    }
    reload();
    const interval = setInterval(() => reload(true), 10000);
    const heart = setInterval(() => act("heartbeat", {}, true), 45000);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const client = createClient(url, key);
      const c = client
        .channel(`room:${roomCode}`, { config: { broadcast: { self: false } } })
        .on("broadcast", { event: "changed" }, ({ payload }) => {
          if (
            payload?.action === "mark" &&
            payload.playerId !== saved.current?.playerId
          )
            playRemoteMark();
          reload(true);
        })
        .subscribe();
      channel.current = c;
    }
    return () => {
      clearInterval(interval);
      clearInterval(heart);
      channel.current?.unsubscribe();
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, roomCode]);
  useEffect(() => {
    if (
      data?.room.bingo_event_id &&
      data.room.bingo_event_id !== heardEvent.current
    ) {
      heardEvent.current = data.room.bingo_event_id;
      const winner = data.players.find(
        (p) => p.id === data.room.winner_player_id,
      );
      if (winner) setCelebration(winner.display_name);
    }
  }, [data]);
  useEffect(() => {
    if (data) {
      setNextCardSet(data.room.card_set);
      setNextWinCondition(data.room.win_condition);
    }
  }, [data?.room.card_set, data?.room.win_condition]);
  async function act(
    action: string,
    extra: Record<string, unknown> = {},
    quiet = false,
  ) {
    const s = saved.current;
    if (!s || (busy && !quiet)) return;
    if (!quiet) setBusy(true);
    try {
      const r = await fetch(`/api/rooms/${roomCode}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          playerId: s.playerId,
          playerSecret: s.playerSecret,
          ...extra,
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      if (action === "mark") playOwnMark();
      channel.current?.send({
        type: "broadcast",
        event: "changed",
        payload: { action, playerId: s.playerId },
      });
      await reload(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that change.");
    } finally {
      if (!quiet) setBusy(false);
    }
  }
  const host = data?.room.host_player_id === data?.me.id;
  const winner = useMemo(
    () => data?.players.find((p) => p.id === data.room.winner_player_id),
    [data],
  );
  const lastMarker = useMemo(
    () =>
      data?.players.find(
        (player) => player.id === data.room.last_marker_player_id,
      ),
    [data],
  );
  if (loading && !data)
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="animate-pulse font-bold text-slate-300">Joining room…</p>
      </main>
    );
  if (!data)
    return (
      <main className="grid min-h-screen place-items-center p-5">
        <section className="panel max-w-md rounded-3xl p-7 text-center">
          <h1 className="text-2xl font-black">Can’t open this room</h1>
          <p className="mt-3 text-slate-300">
            {error || "You need to join this room from the home page first."}
          </p>
          <Link className="btn btn-primary mt-6 inline-block" href="/">
            Back home
          </Link>
        </section>
      </main>
    );
  return (
    <main className="mx-auto max-w-[1500px] p-4 md:p-7">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-lg font-black tracking-tight">
          THREE <span className="text-violet">GAMES IN</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-white/5 px-3 py-2 text-sm font-black tracking-[.2em]">
            {roomCode}
          </span>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="btn btn-secondary !py-2 text-sm"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </header>
      {error && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
        <aside className="order-2 space-y-5 xl:order-1">
          <section className="panel rounded-2xl p-5">
            <p className="text-xs font-black tracking-widest text-mint">
              {CARD_SETS[data.room.card_set].label.toUpperCase()} · ROOM STATUS
            </p>
            <p className="mt-2 text-xl font-black">
              {statusText[data.room.status]}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Round {data.room.round_number || "—"}
            </p>
            <p className="mt-2 text-sm font-bold text-violet">
              {WIN_CONDITIONS[data.room.win_condition].label}
            </p>
            {lastMarker && data.room.status === "active" && (
              <p
                className="mt-3 rounded-lg bg-violet/10 px-2 py-2 text-xs font-bold text-violet"
                aria-live="polite"
              >
                Latest mark: {lastMarker.display_name}
              </p>
            )}
            {winner && (
              <p className="mt-3 text-sm font-bold text-mint">
                Winner: {winner.display_name}
              </p>
            )}
          </section>
          <PlayerList
            players={data.players}
            hostId={data.room.host_player_id}
            canRemove={host}
            remove={(id) => act("remove", { targetId: id })}
          />
        </aside>
        <section className="order-1 xl:order-2">
          <div className="panel rounded-2xl p-4 sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-widest text-violet">
                  YOUR CARD · {CARD_SETS[data.room.card_set].label}
                </p>
                <h1 className="mt-1 text-2xl font-black">
                  {data.me.display_name}
                </h1>
              </div>
              <p className="text-right text-sm font-bold text-slate-300">
                {data.me.has_bingo
                  ? "BINGO!"
                  : `${data.me.progress_count}/16 marked`}
              </p>
            </div>
            {data.card ? (
              <BingoCard
                cardSet={data.room.card_set}
                order={data.card.card_order}
                selected={data.card.selected_squares}
                disabled={
                  busy || data.room.status !== "active" || data.card.locked
                }
                onMark={(i) => act("mark", { index: i })}
              />
            ) : (
              <div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-white/15 text-center text-slate-400">
                The host hasn’t started a round yet.
              </div>
            )}
          </div>
        </section>
        <aside className="order-3 space-y-5">
          <section className="panel rounded-2xl p-5">
            <h2 className="font-black">Game info</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Everyone has the same prompts in a different order. Mark them as
              they happen—four in any row, column, or diagonal wins.
            </p>
          </section>
          {host && (
            <section className="panel rounded-2xl p-5">
              <h2 className="font-black">Host controls</h2>
              <div className="mt-4 grid gap-2">
                <label className="text-xs font-bold text-slate-300">
                  Next round card
                  <select
                    value={nextCardSet}
                    onChange={(event) =>
                      setNextCardSet(
                        event.target.value as keyof typeof CARD_SETS,
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm"
                  >
                    {Object.entries(CARD_SETS).map(([key, set]) => (
                      <option key={key} value={key}>
                        {set.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-300">
                  Win condition
                  <select
                    value={nextWinCondition}
                    onChange={(event) =>
                      setNextWinCondition(event.target.value as WinCondition)
                    }
                    className="mt-1 w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm"
                  >
                    {Object.entries(WIN_CONDITIONS).map(([key, condition]) => (
                      <option key={key} value={key}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                </label>
                {data.room.status === "waiting" ? (
                  <button
                    disabled={busy}
                    onClick={() =>
                      act("start", {
                        cardSet: nextCardSet,
                        winCondition: nextWinCondition,
                      })
                    }
                    className="btn btn-primary"
                  >
                    Start first round
                  </button>
                ) : (
                  <>
                    <button
                      disabled={busy}
                      onClick={() =>
                        act("new_round", {
                          cardSet: nextCardSet,
                          winCondition: nextWinCondition,
                        })
                      }
                      className="btn btn-primary"
                    >
                      Start {CARD_SETS[nextCardSet].label} round
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => act("end")}
                      className="btn btn-secondary"
                    >
                      End current round
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => act("reset")}
                      className="btn btn-danger"
                    >
                      Reset room
                    </button>
                  </>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
      {celebration && (
        <BingoCelebration
          winner={celebration}
          dismiss={() => setCelebration(null)}
        />
      )}
    </main>
  );
}
