"use client";
import { CARD_SETS, CardSetKey } from "@/lib/prompts";
export function BingoCard({
  order,
  selected,
  disabled,
  onMark,
  cardSet,
  boardSize,
}: {
  order: number[];
  selected: number[];
  disabled: boolean;
  onMark: (index: number) => void;
  cardSet: CardSetKey;
  boardSize: 3 | 4 | 5;
}) {
  const prompts = CARD_SETS[cardSet].prompts;
  return (
    <div
      className="grid gap-2 sm:gap-3"
      style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
      aria-label="Your bingo card"
    >
      {order.map((promptIndex, index) => (
        <button
          key={index}
          aria-pressed={selected.includes(index)}
          aria-label={`${prompts[promptIndex]} — ${selected.includes(index) ? "completed" : "not completed"}`}
          disabled={disabled}
          onClick={() => onMark(index)}
          className={`square ${selected.includes(index) ? "selected" : ""}`}
        >
          {prompts[promptIndex]}
        </button>
      ))}
    </div>
  );
}
