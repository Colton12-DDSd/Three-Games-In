import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase/server";
import {
  hasBingo,
  oneAway,
  cleanName,
  randomUUID,
  shuffle,
  transferHost,
} from "@/lib/rooms";
import { completedPatterns, isCardSet, isWinCondition } from "@/lib/prompts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  try {
    const { roomCode } = await params,
      body = await request.json(),
      { playerId, playerSecret, action } = body;
    const db = admin();
    const { data: room } = await db
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .single();
    const { data: me } = await db
      .from("players")
      .select("*")
      .eq("id", playerId)
      .eq("room_id", room.id)
      .eq("access_secret", playerSecret)
      .single();
    const now = new Date().toISOString();
    if (action === "heartbeat") {
      await db
        .from("players")
        .update({ last_seen_at: now, is_active: true })
        .eq("id", me.id);
      await db
        .from("rooms")
        .update({ last_activity_at: now })
        .eq("id", room.id);
      await transferHost(room.id);
      return NextResponse.json({ ok: true });
    }
    if (action === "rename") {
      const name = cleanName(body.name);
      if (!name)
        return NextResponse.json(
          { error: "Enter a display name." },
          { status: 400 },
        );
      const { error } = await db
        .from("players")
        .update({ display_name: name })
        .eq("id", me.id);
      if (error)
        return NextResponse.json(
          { error: "That display name is already in use." },
          { status: 409 },
        );
      return NextResponse.json({ ok: true });
    }
    if (action === "leave") {
      const { data: remaining } = await db
        .from("players")
        .select("id,is_active,joined_at")
        .eq("room_id", room.id)
        .neq("id", me.id)
        .order("is_active", { ascending: false })
        .order("joined_at");
      await db.from("players").delete().eq("id", me.id);
      const { count } = await db
        .from("players")
        .select("id", { count: "exact", head: true })
        .eq("room_id", room.id);
      if (!count) {
        await db.from("rooms").delete().eq("id", room.id);
      } else if (room.host_player_id === me.id && remaining?.[0]) {
        await db
          .from("rooms")
          .update({ host_player_id: remaining[0].id, last_activity_at: now })
          .eq("id", room.id);
      }
      return NextResponse.json({ ok: true });
    }
    if (action === "mark") {
      if (
        room.status !== "active" &&
        !(room.status === "bingo" && room.winner_player_id === me.id)
      )
        return NextResponse.json(
          { error: "The round is not active." },
          { status: 400 },
        );
      const index = Number(body.index);
      if (!Number.isInteger(index) || index < 0 || index > 15)
        return NextResponse.json({ error: "Invalid square." }, { status: 400 });
      const { data: card } = await db
        .from("player_cards")
        .select("*")
        .eq("player_id", me.id)
        .eq("round_number", room.round_number)
        .single();
      const selected = Array.isArray(card.selected_squares)
        ? (card.selected_squares as number[])
        : [];
      const wasSelected = selected.includes(index);
      const next = wasSelected
        ? selected.filter((x) => x !== index)
        : [...selected, index];
      const patterns = completedPatterns(next, room.win_condition);
      const previousPatterns = Array.isArray(card.bingo_patterns)
        ? (card.bingo_patterns as string[])
        : [];
      const newPatterns = patterns.filter(
        (pattern) => !previousPatterns.includes(pattern),
      );
      const allPatterns = [...new Set([...previousPatterns, ...patterns])];
      const newPatternCount = newPatterns.length;
      const bingo = patterns.length > 0;
      await db
        .from("player_cards")
        .update({
          selected_squares: next,
          locked: false,
          bingo_patterns: allPatterns,
        })
        .eq("player_id", me.id)
        .eq("round_number", room.round_number);
      await db
        .from("players")
        .update({
          progress_count: next.length,
          has_bingo: bingo,
          total_marks: me.total_marks + (wasSelected ? 0 : 1),
          last_seen_at: now,
        })
        .eq("id", me.id);
      const roomUpdate = {
        last_marker_player_id: me.id,
        last_marked_at: now,
        last_activity_at: now,
      };
      if (newPatternCount > 0 && !room.winner_player_id) {
        const eventId = randomUUID();
        const { data: claimed } = await db
          .from("rooms")
          .update({
            ...roomUpdate,
            status: "bingo",
            winner_player_id: me.id,
            bingo_event_id: eventId,
            celebration_label: "BINGO!",
            winner_pattern_count: patterns.length,
          })
          .eq("id", room.id)
          .is("winner_player_id", null)
          .select("id")
          .maybeSingle();
        if (claimed) {
          await db
            .from("players")
            .update({ bingo_count: me.bingo_count + 1 })
            .eq("id", me.id);
          const [{ data: cards }, { data: contenders }] = await Promise.all([
            db
              .from("player_cards")
              .select("player_id,selected_squares")
              .eq("round_number", room.round_number),
            db
              .from("players")
              .select("id,near_miss_count")
              .eq("room_id", room.id)
              .neq("id", me.id),
          ]);
          for (const contender of contenders ?? []) {
            const contenderCard = cards?.find(
              (entry) => entry.player_id === contender.id,
            );
            const picked = Array.isArray(contenderCard?.selected_squares)
              ? (contenderCard.selected_squares as number[])
              : [];
            if (oneAway(picked, room.win_condition))
              await db
                .from("players")
                .update({ near_miss_count: contender.near_miss_count + 1 })
                .eq("id", contender.id);
          }
        }
      } else if (newPatternCount > 0 && room.winner_player_id === me.id) {
        const label =
          patterns.length === 2
            ? "DOUBLE BINGO!"
            : `${patterns.length}× BINGO!`;
        await db
          .from("rooms")
          .update({
            ...roomUpdate,
            bingo_event_id: randomUUID(),
            celebration_label: label,
            winner_pattern_count: patterns.length,
          })
          .eq("id", room.id);
      } else await db.from("rooms").update(roomUpdate).eq("id", room.id);
      return NextResponse.json({ ok: true, bingo });
    }
    if (room.host_player_id !== me.id)
      return NextResponse.json(
        { error: "Only the host can do that." },
        { status: 403 },
      );
    if (action === "start" || action === "new_round") {
      const nextRound = room.round_number + 1,
        cardSet = isCardSet(body.cardSet) ? body.cardSet : room.card_set,
        winCondition = isWinCondition(body.winCondition)
          ? body.winCondition
          : room.win_condition;
      const { data: all } = await db
        .from("players")
        .select("id")
        .eq("room_id", room.id);
      for (const p of all ?? [])
        await db.from("player_cards").insert({
          player_id: p.id,
          round_number: nextRound,
          card_order: shuffle(),
          selected_squares: [],
        });
      await db
        .from("players")
        .update({ progress_count: 0, has_bingo: false })
        .eq("room_id", room.id);
      await db
        .from("rooms")
        .update({
          card_set: cardSet,
          win_condition: winCondition,
          round_number: nextRound,
          status: "active",
          winner_player_id: null,
          bingo_event_id: null,
          last_activity_at: now,
        })
        .eq("id", room.id);
      return NextResponse.json({ ok: true });
    }
    if (action === "end") {
      await db
        .from("rooms")
        .update({ status: "ended", last_activity_at: now })
        .eq("id", room.id);
      return NextResponse.json({ ok: true });
    }
    if (action === "reset") {
      await db
        .from("players")
        .update({ progress_count: 0, has_bingo: false })
        .eq("room_id", room.id);
      await db
        .from("rooms")
        .update({
          status: "waiting",
          winner_player_id: null,
          bingo_event_id: null,
          last_activity_at: now,
        })
        .eq("id", room.id);
      return NextResponse.json({ ok: true });
    }
    if (action === "remove" && body.targetId && body.targetId !== me.id) {
      await db
        .from("players")
        .delete()
        .eq("id", body.targetId)
        .eq("room_id", room.id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Room action failed", error);
    return NextResponse.json(
      { error: "That change could not be saved." },
      { status: 500 },
    );
  }
}
