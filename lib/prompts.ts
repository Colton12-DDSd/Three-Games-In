export const CARD_SETS = {
  arenas: {
    label: "Arenas",
    prompts: [
      "Dumper in graphs",
      "Random song singing",
      "Duncan says “particularly”",
      "“I’m going crazy”",
      "Most deaths",
      "Kayl talks to himself for chat",
      "“Chat, do X”",
      "Picking non-bravery",
      "Someone joins the Discord call and ruins it",
      "Kayl goes anvils",
      "“This was the best I was offered”",
      "Die to ring",
      "Get hit by pillar or ball bomb",
      "Pick a prismatic",
      "Pick a quest augment",
      "Pick a curse augment",
    ],
  },
  r6: {
    label: "R6",
    prompts: [
      "Die to a trap",
      "Die first in a round",
      "Lowest K/D",
      "Lose last 1v1",
      "Die from ceiling, floor, or hatch",
      "Die through wall",
      "Team kill",
      "Glaverick",
      "“I’m getting in there”",
      "Die to C4 or claymore",
      "0–3 as attacker or defender",
      "Get spawn peeked",
      "Someone red pings",
      "Enemy plants defuser",
      "Enemy 5–0s a round",
      "Rando rages at one of us",
    ],
  },
  pummel: {
    label: "Pummel",
    prompts: [
      "Roll last on a turn",
      "Get killed by a player",
      "Get sucked",
      "Get hit by item",
      "Pass chest without enough keys",
      "Play some bullshit modded minigame",
      "Killed by board",
      "Get a goblet",
      "Roll a 0 or 9",
      "Get sucked into present",
      "Get punched in minigame",
      "Lose in arcade game",
      "End in the cage",
      "Get shotgunned",
      "Buy goblet for >45",
      "Use warp",
    ],
  },
} as const;
export type CardSetKey = keyof typeof CARD_SETS;
export const BINGO_PROMPTS = CARD_SETS.arenas.prompts;
export const isCardSet = (value: unknown): value is CardSetKey =>
  typeof value === "string" && value in CARD_SETS;
export const WINNING_LINES = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
  [8, 9, 10, 11],
  [12, 13, 14, 15],
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [3, 6, 9, 12],
];
export const hasBingo = (picked: number[]) =>
  WINNING_LINES.some((line) => line.every((index) => picked.includes(index)));
export const oneAway = (picked: number[]) =>
  !hasBingo(picked) &&
  WINNING_LINES.some(
    (line) => line.filter((index) => !picked.includes(index)).length === 1,
  );
