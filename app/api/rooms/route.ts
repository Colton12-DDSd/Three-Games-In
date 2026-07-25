import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase/server";
import { cleanName, makeCode, randomUUID, shuffle } from "@/lib/rooms";
import {
  CARD_SETS,
  isBoardSize,
  isCardSet,
  isWinCondition,
} from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const {
      intent,
      name,
      roomCode,
      playerId,
      playerSecret,
      cardSet,
      winCondition,
      boardSize,
    } = await request.json();
    const displayName = cleanName(name);
    if (!displayName)
      return NextResponse.json(
        { error: "Enter a display name." },
        { status: 400 },
      );
    const db = admin();
    if (intent === "create") {
      let code = makeCode();
      for (let i = 0; i < 5; i++) {
        const { data } = await db
          .from("rooms")
          .select("id")
          .eq("room_code", code)
          .maybeSingle();
        if (!data) break;
        code = makeCode();
      }
      const id = playerId || randomUUID(),
        secret = playerSecret || randomUUID();
      const selectedSet = isCardSet(cardSet) ? cardSet : "arenas",
        selectedSize = isBoardSize(boardSize) ? boardSize : 4;
      if (CARD_SETS[selectedSet].prompts.length < selectedSize ** 2)
        return NextResponse.json(
          { error: "That game needs more prompts for this board size." },
          { status: 400 },
        );
      const { data: room, error } = await db
        .from("rooms")
        .insert({
          room_code: code,
          host_player_id: null,
          card_set: isCardSet(cardSet) ? cardSet : "arenas",
          board_size: selectedSize,
          win_condition: isWinCondition(winCondition) ? winCondition : "line",
        })
        .select()
        .single();
      if (error) throw error;
      const { error: playerError } = await db
        .from("players")
        .insert({
          id,
          room_id: room.id,
          display_name: displayName,
          access_secret: secret,
        })
        .select()
        .single();
      if (playerError) throw playerError;
      await db
        .from("rooms")
        .update({
          host_player_id: id,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", room.id);
      return NextResponse.json({
        roomCode: code,
        playerId: id,
        playerSecret: secret,
      });
    }
    const code = String(roomCode ?? "")
      .toUpperCase()
      .replace(/[^A-Z2-9]/g, "");
    const { data: room } = await db
      .from("rooms")
      .select("*")
      .eq("room_code", code)
      .maybeSingle();
    if (
      !room ||
      Date.now() - new Date(room.last_activity_at).getTime() > 86400000
    )
      return NextResponse.json(
        { error: "That room doesn’t exist or has expired." },
        { status: 404 },
      );
    if (playerId && playerSecret) {
      const { data: existing } = await db
        .from("players")
        .select("id")
        .eq("id", playerId)
        .eq("room_id", room.id)
        .eq("access_secret", playerSecret)
        .maybeSingle();
      if (existing)
        return NextResponse.json({ roomCode: code, playerId, playerSecret });
    }
    const { data: duplicate } = await db
      .from("players")
      .select("id")
      .eq("room_id", room.id)
      .ilike("display_name", displayName)
      .maybeSingle();
    if (duplicate)
      return NextResponse.json(
        { error: "That display name is already in this room." },
        { status: 409 },
      );
    const id = randomUUID(),
      secret = randomUUID();
    const { error } = await db.from("players").insert({
      id,
      room_id: room.id,
      display_name: displayName,
      access_secret: secret,
    });
    if (error) throw error;
    if (room.round_number > 0)
      await db.from("player_cards").insert({
        player_id: id,
        round_number: room.round_number,
        card_order: shuffle(
          CARD_SETS[room.card_set as keyof typeof CARD_SETS].prompts.length,
          room.board_size ** 2,
        ),
        selected_squares: [],
      });
    await db
      .from("rooms")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", room.id);
    return NextResponse.json({
      roomCode: code,
      playerId: id,
      playerSecret: secret,
    });
  } catch (error) {
    console.error("Room creation/join failed", error);
    return NextResponse.json(
      { error: "Unable to reach the game database. Please try again." },
      { status: 500 },
    );
  }
}
