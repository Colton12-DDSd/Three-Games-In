import { Player } from "@/lib/types";

export function PlayerList({
  players,
  hostId,
  canRemove,
  remove,
  inspect,
  lastMarkerId,
}: {
  players: Player[];
  hostId: string;
  canRemove: boolean;
  remove: (id: string) => void;
  inspect: (player: Player) => void;
  lastMarkerId: string | null;
}) {
  return (
    <section className="panel rounded-2xl p-5">
      <h2 className="font-black">
        Players <span className="text-slate-400">({players.length})</span>
      </h2>
      <p className="mt-1 text-xs text-slate-400">
        Tap a player to view their board.
      </p>
      <div className="mt-4 space-y-2">
        {players.length === 0 && (
          <p className="text-sm text-slate-400">Waiting for someone to join.</p>
        )}
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${player.is_active ? "bg-white/5" : "bg-black/10 opacity-60"}`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${player.is_active ? "bg-mint" : "bg-slate-500"}`}
            />
            <button
              onClick={() => inspect(player)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate font-bold">
                {player.display_name}{" "}
                {player.id === hostId && (
                  <span className="text-xs text-violet">HOST</span>
                )}{" "}
                {player.id === lastMarkerId && (
                  <span className="ml-1 inline-block animate-pulse rounded bg-mint/20 px-1.5 py-0.5 text-xs text-mint">
                    +1
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400">
                {player.has_bingo
                  ? "BINGO"
                  : `${player.progress_count}/16${player.is_one_away ? " · closing in" : ""}`}
              </p>
            </button>
            {canRemove && player.id !== hostId && (
              <button
                aria-label={`Remove ${player.display_name}`}
                onClick={() => remove(player.id)}
                className="text-xs text-rose-300"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
