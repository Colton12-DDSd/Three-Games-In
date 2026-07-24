"use client";
import { CARD_SETS, CardSetKey } from "@/lib/prompts";
export function BingoCard({
  order,
  selected,
  disabled,
  onMark,
  cardSet,
}: {
  order: number[];
  selected: number[];
  disabled: boolean;
  onMark: (index: number) => void;
  cardSet: CardSetKey;
}) {
  const prompts = CARD_SETS[cardSet].prompts;
  return (
    <div
      className="grid grid-cols-4 gap-2 sm:gap-3"
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
