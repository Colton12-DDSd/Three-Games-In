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
      "Your team has Dragonheart",
      "Your team has Demon King’s Crown",
      "Your team has Cruelty",
      "You face a team with Dragonheart",
      "You face a team with Demon King’s Crown",
      "You face a team with Cruelty",
      "Transmute any Augment",
      "Your team has Tank Engine",
      "Your team has Phenomenal Evil",
      "You face a team with Transmute: Prismatic",
      "You face a team with Tank Engine",
      "You face a team with Phenomenal Evil",
      "Your team has Jeweled Gauntlet",
      "Your team has Goliath",
      "Your team has Dual Wield",
      "You face a team with Jeweled Gauntlet",
      "You face a team with Goliath",
      "You face a team with Dual Wield",
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
      "Your team dies to a spawn-peeker",
      "Your team is onsite without the Defuser",
      "Your team reinforces fewer than 5 walls at match start",
      "Your team destroys a friendly gadget",
      "Your team gets a team kill",
      "Your team wins without planting",
      "Your team has someone finish with zero kills",
      "Your team has someone attempt a runout",
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
      "You roll a 1",
      "You roll a 2",
      "You roll a 3",
      "You roll a 6",
      "You roll a 7",
      "You roll an 8",
      "You roll a 9",
      "You win a minigame",
      "You lose a minigame",
      "You finish a minigame in last place",
      "You steal keys",
      "Someone steals your keys",
      "You use an item",
      "An item is used on you",
    ],
  },
} as const;
export type CardSetKey = keyof typeof CARD_SETS;
export const BOARD_SIZES = [3, 4, 5] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];
export const isBoardSize = (value: unknown): value is BoardSize =>
  typeof value === "number" && BOARD_SIZES.includes(value as BoardSize);
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
export const WIN_CONDITIONS = {
  line: { label: "Any line", description: "Any row, column, or diagonal" },
  corners: { label: "Four corners", description: "All four corner squares" },
  x: { label: "X", description: "Both diagonals" },
  corners_center: {
    label: "Corners + center",
    description: "Four corners and the center",
  },
  blackout: { label: "Blackout", description: "Mark every square" },
} as const;
export type WinCondition = keyof typeof WIN_CONDITIONS;
export const isWinCondition = (value: unknown): value is WinCondition =>
  typeof value === "string" && value in WIN_CONDITIONS;
export const winningLines = (size: number) =>
  [...Array(size).keys()].flatMap((index) => [
    [...Array(size).keys()].map((column) => index * size + column),
    [...Array(size).keys()].map((row) => row * size + index),
  ]);
export const hasBingo = (
  picked: number[],
  condition: WinCondition = "line",
  size = 4,
) => {
  const marked = (line: number[]) =>
    line.every((index) => picked.includes(index));
  const corners = [0, size - 1, size * (size - 1), size * size - 1];
  if (condition === "corners") return marked(corners);
  if (condition === "x")
    return (
      marked([...Array(size).keys()].map((i) => i * size + i)) &&
      marked([...Array(size).keys()].map((i) => i * size + size - 1 - i))
    );
  if (condition === "corners_center")
    return (
      size % 2 === 1 && marked([...corners, Math.floor((size * size) / 2)])
    );
  if (condition === "blackout") return picked.length === size * size;
  return winningLines(size).some(marked);
};
export const completedPatterns = (
  picked: number[],
  condition: WinCondition = "line",
  size = 4,
) => {
  if (condition !== "line")
    return hasBingo(picked, condition, size) ? [condition] : [];
  return winningLines(size)
    .map((line, index) => ({ line, key: `line-${index}` }))
    .filter(({ line }) => line.every((index) => picked.includes(index)))
    .map(({ key }) => key);
};
export const oneAway = (
  picked: number[],
  condition: WinCondition = "line",
  size = 4,
) => {
  if (hasBingo(picked, condition, size)) return false;
  const needed =
    condition === "corners"
      ? [0, size - 1, size * (size - 1), size * size - 1]
      : condition === "x"
        ? [0, 5, 10, 15, 3, 6, 9, 12]
        : condition === "corners_center"
          ? [0, 3, 5, 12, 15]
          : condition === "blackout"
            ? [...Array(size * size).keys()]
            : null;
  return needed
    ? needed.filter((index) => !picked.includes(index)).length === 1
    : winningLines(size).some(
        (line) => line.filter((index) => !picked.includes(index)).length === 1,
      );
};
