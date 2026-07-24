import { Player } from "@/lib/types";

function Leaderboard({
  title,
  players,
  stat,
}: {
  title: string;
  players: Player[];
  stat: "bingo_count" | "total_marks";
}) {
  const top = [...players].sort((a, b) => b[stat] - a[stat]).slice(0, 3);
  return (
    <div>
      <p className="text-xs font-black tracking-wider text-slate-400">
        {title}
      </p>
      <ol className="mt-2 space-y-2">
        {top.map((player, index) => (
          <li
            key={player.id}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2"
          >
            <span className="w-4 font-black text-violet">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate font-bold">
              {player.display_name}
            </span>
            <span className="font-black text-mint">{player[stat]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
export function RoomStats({ players }: { players: Player[] }) {
  return (
    <section className="panel rounded-2xl p-5">
      <h2 className="font-black">Room leaders</h2>
      <p className="mt-1 text-xs text-slate-400">
        Across this room&apos;s rounds
      </p>
      <div className="mt-4 space-y-5">
        <Leaderboard title="MOST BINGOS" players={players} stat="bingo_count" />
        <Leaderboard title="MOST MARKED" players={players} stat="total_marks" />
      </div>
    </section>
  );
}
