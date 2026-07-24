# Three Games In

A fast, mobile-friendly multiplayer bingo board for game night. Create a room, share its six-character code, and every player gets a persisted, differently shuffled 4×4 card. Progress, winners, and round changes update live.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Postgres and Realtime Broadcast
- Vercel-ready route handlers

## Run locally

1. Clone the repository: `git clone https://github.com/Colton12-DDSd/Three-Games-In.git`
2. Install Node.js 20+ and dependencies: `npm install`
3. Create a Supabase project.
4. In the Supabase SQL editor, run `supabase/migrations/202607230001_initial.sql`.
5. Copy `.env.example` to `.env.local` and add your project URL, anon key, and service-role key.
6. Enable Realtime Broadcast in your Supabase project (Database Changes are not used for sensitive card data).
7. Start the app with `npm run dev`.

The service-role key stays server-only: it is used by route handlers to check a player’s random per-device secret before any write. Never prefix it with `NEXT_PUBLIC_` and never commit `.env.local`.

## How realtime works

Each browser joins a Supabase Broadcast channel for its room. After a valid server-side change it broadcasts a small “changed” notification, then every connected browser reloads the authoritative room state from the server. A 10-second refresh fallback covers temporary disconnects and reconnecting clients. Exact card layouts and selections are only returned to their owning player.

## Deploy to Vercel

1. Push this repository to GitHub: `https://github.com/Colton12-DDSd/Three-Games-In.git`.
2. Import `Colton12-DDSd/Three-Games-In` in Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Vercel’s environment variables.
4. Apply the migration above to Supabase, then deploy. No custom server is required.

## Editing prompts

Edit the `BINGO_PROMPTS` array in `lib/prompts.ts`. Every card always uses all 16 prompts, shuffled per player and round.

## Notes and limitations

- Rooms expire after 24 hours without activity.
- Identity is browser-local anonymous identity; clearing browser storage creates a new player.
- Host transfer occurs when the host has been inactive for more than three minutes and another active player is available.
- The first release uses a visual celebration only; it deliberately does not autoplay sound.
