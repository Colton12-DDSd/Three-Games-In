"use client";
import { BingoCard } from "@/components/bingo-card";
import { CardSetKey } from "@/lib/prompts";
import { Player, SharedCard } from "@/lib/types";

export function CardInspector({
  player,
  card,
  cardSet,
  close,
}: {
  player: Player;
  card?: SharedCard;
  cardSet: CardSetKey;
  close: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${player.display_name}'s bingo card`}
    >
      <div className="mx-auto my-4 max-w-3xl rounded-3xl border border-white/15 bg-panel p-5 shadow-2xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-widest text-violet">
              PLAYER BOARD
            </p>
            <h2 className="mt-1 text-3xl font-black">{player.display_name}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {player.has_bingo
                ? "BINGO!"
                : `${player.progress_count}/16 marked`}
            </p>
          </div>
          <button autoFocus className="btn btn-secondary !py-2" onClick={close}>
            Close
          </button>
        </div>
        {card ? (
          <BingoCard
            cardSet={cardSet}
            order={card.card_order}
            selected={card.selected_squares}
            disabled
            onMark={() => {}}
          />
        ) : (
          <p className="rounded-xl bg-white/5 p-6 text-slate-400">
            This player has not been assigned a card for this round yet.
          </p>
        )}
      </div>
    </div>
  );
}
