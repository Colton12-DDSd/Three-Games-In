export function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("The game is not configured yet. Ask the host to add the Supabase environment variables.");
  return { url, key };
}
