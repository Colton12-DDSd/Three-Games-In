import { randomBytes, randomUUID } from "crypto";
import { BINGO_PROMPTS, hasBingo, oneAway } from "@/lib/prompts";
import { admin } from "@/lib/supabase/server";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const makeCode = () => Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
export const shuffle = (last?: number[]) => { let card = [...Array(16).keys()]; do { for (let i = 15; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [card[i], card[j]] = [card[j], card[i]]; } } while (last && card.every((item, i) => item === last[i])); return card; };
export const cleanName = (name: unknown) => String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
export const isExpired = (last: string) => Date.now() - new Date(last).getTime() > 86400000;
export async function identify(roomCode: string, playerId?: string, playerSecret?: string) {
  const db = admin(); const { data: room } = await db.from("rooms").select("*").eq("room_code", roomCode.toUpperCase()).maybeSingle();
  if (!room || isExpired(room.last_activity_at)) return null;
  if (!playerId || !playerSecret) return { room, player: null };
  const { data: player } = await db.from("players").select("*").eq("id", playerId).eq("room_id", room.id).eq("access_secret", playerSecret).maybeSingle();
  return { room, player };
}
export async function transferHost(roomId: string) {
  const db = admin(); const cutoff = new Date(Date.now() - 180000).toISOString();
  const { data: room } = await db.from("rooms").select("host_player_id").eq("id", roomId).single();
  if (!room?.host_player_id) return;
  const { data: host } = await db.from("players").select("last_seen_at").eq("id", room.host_player_id).maybeSingle();
  if (!host || host.last_seen_at < cutoff) { const { data: next } = await db.from("players").select("id").eq("room_id", roomId).gte("last_seen_at", cutoff).order("joined_at").limit(1).maybeSingle(); if (next) await db.from("rooms").update({ host_player_id: next.id }).eq("id", roomId); }
}
export async function roomPayload(roomCode: string, player: { id: string }) {
  const db = admin(); const found = await identify(roomCode, player.id, (player as { access_secret?: string }).access_secret); if (!found?.player) throw new Error("You are not a member of this room.");
  const [{ data: players }, { data: card }] = await Promise.all([db.from("players").select("id,display_name,progress_count,has_bingo,is_active,joined_at,last_seen_at").eq("room_id", found.room.id).order("joined_at"), db.from("player_cards").select("card_order,selected_squares,locked").eq("player_id", player.id).eq("round_number", found.room.round_number).single()]);
  return { room: found.room, players: players ?? [], me: { id: found.player.id, display_name: found.player.display_name, progress_count: found.player.progress_count, has_bingo: found.player.has_bingo, is_active: found.player.is_active, joined_at: found.player.joined_at, last_seen_at: found.player.last_seen_at }, card };
}
export { BINGO_PROMPTS, hasBingo, oneAway, randomUUID, randomBytes };
