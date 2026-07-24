export const BINGO_PROMPTS = [
  "Dumper in graphs", "Random song singing", "Duncan says “particularly”", "“I’m going crazy”",
  "Most deaths", "Kayl talks to himself for chat", "“Chat, do X”", "Picking non-bravery",
  "Someone joins the Discord call and ruins it", "Kayl goes anvils", "“This was the best I was offered”", "Die to ring",
  "Get hit by pillar or ball bomb", "Pick a prismatic", "Pick a quest augment", "Pick a curse augment"
] as const;
export const WINNING_LINES = [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],[0,5,10,15],[3,6,9,12]];
export const hasBingo = (picked: number[]) => WINNING_LINES.some(line => line.every(index => picked.includes(index)));
export const oneAway = (picked: number[]) => !hasBingo(picked) && WINNING_LINES.some(line => line.filter(index => !picked.includes(index)).length === 1);
