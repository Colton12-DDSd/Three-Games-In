import { Player } from "@/lib/types";

function Leader({
  label,
  player,
  value,
}: {
  label: string;
  player?: Player;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-xs font-black tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate font-bold text-mint">
        {player?.display_name ?? "No leader yet"}
      </p>
      <p className="text-xs text-slate-400">{player ? value : 0}</p>
    </div>
  );
}
export function RoomStats({ players }: { players: Player[] }) {
  const leader = (key: "bingo_count" | "total_marks" | "near_miss_count") =>
    [...players].sort((a, b) => b[key] - a[key])[0];
  const bingos = leader("bingo_count"),
    marks = leader("total_marks"),
    close = leader("near_miss_count");
  return (
    <section className="panel rounded-2xl p-5">
      <h2 className="font-black">Room stats</h2>
      <p className="mt-1 text-xs text-slate-400">
        Across this room&apos;s rounds
      </p>
      <div className="mt-4 grid gap-2">
        <Leader
          label="MOST BINGOS"
          player={bingos}
          value={bingos?.bingo_count ?? 0}
        />
        <Leader
          label="MOST MARKED"
          player={marks}
          value={marks?.total_marks ?? 0}
        />
        <Leader
          label="CLOSEST CALLS"
          player={close}
          value={close?.near_miss_count ?? 0}
        />
      </div>
    </section>
  );
}
