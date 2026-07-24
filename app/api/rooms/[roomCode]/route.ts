import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase/server";
import { isExpired, transferHost } from "@/lib/rooms";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> },
) {
  try {
    const { roomCode } = await params,
      q = request.nextUrl.searchParams,
      id = q.get("playerId"),
      secret = q.get("playerSecret");
    if (!id || !secret)
      return NextResponse.json(
        { error: "Join this room first." },
        { status: 401 },
      );
    const db = admin();
    const { data: room } = await db
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode.toUpperCase())
      .maybeSingle();
    if (!room || isExpired(room.last_activity_at))
      return NextResponse.json(
        { error: "Room not found or expired." },
        { status: 404 },
      );
    const { data: me } = await db
      .from("players")
      .select("*")
      .eq("id", id)
      .eq("room_id", room.id)
      .eq("access_secret", secret)
      .maybeSingle();
    if (!me)
      return NextResponse.json(
        { error: "You are not a member of this room." },
        { status: 403 },
      );
    await transferHost(room.id);
    const { data: freshRoom } = await db
      .from("rooms")
      .select("*")
      .eq("id", room.id)
      .single();
    const [{ data: players }, { data: card }] = await Promise.all([
      db
        .from("players")
        .select(
          "id,display_name,progress_count,has_bingo,bingo_count,total_marks,near_miss_count,is_active,joined_at,last_seen_at",
        )
        .eq("room_id", room.id)
        .order("joined_at"),
      db
        .from("player_cards")
        .select("card_order,selected_squares,locked")
        .eq("player_id", id)
        .eq("round_number", freshRoom.round_number)
        .maybeSingle(),
    ]);
    return NextResponse.json({
      room: freshRoom,
      players: players ?? [],
      me: {
        id: me.id,
        display_name: me.display_name,
        progress_count: me.progress_count,
        has_bingo: me.has_bingo,
        bingo_count: me.bingo_count,
        total_marks: me.total_marks,
        near_miss_count: me.near_miss_count,
        is_active: me.is_active,
        joined_at: me.joined_at,
        last_seen_at: me.last_seen_at,
      },
      card,
    });
  } catch (error) {
    console.error("Room load failed", error);
    return NextResponse.json(
      { error: "Unable to load the room." },
      { status: 500 },
    );
  }
}
