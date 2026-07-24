export type RoomStatus = "waiting" | "active" | "bingo" | "ended" | "reset";
export type Room = {
  id: string;
  room_code: string;
  card_set: "arenas" | "r6" | "pummel";
  win_condition: "line" | "corners" | "x" | "corners_center" | "blackout";
  host_player_id: string;
  round_number: number;
  status: RoomStatus;
  winner_player_id: string | null;
  bingo_event_id: string | null;
  celebration_label: string | null;
  winner_pattern_count: number;
  last_marker_player_id: string | null;
  last_marked_at: string | null;
  last_activity_at: string;
};
export type Player = {
  id: string;
  display_name: string;
  progress_count: number;
  has_bingo: boolean;
  is_one_away: boolean;
  bingo_count: number;
  total_marks: number;
  is_active: boolean;
  joined_at: string;
  last_seen_at: string;
};
export type Card = {
  card_order: number[];
  selected_squares: number[];
  locked: boolean;
  bingo_patterns: string[];
};
export type SharedCard = {
  player_id: string;
  card_order: number[];
  selected_squares: number[];
};
export type RoomPayload = {
  room: Room;
  players: Player[];
  me: Player;
  card: Card;
  cards: SharedCard[];
};
