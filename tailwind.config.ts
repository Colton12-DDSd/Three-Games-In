import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#090b14", panel: "#131827", violet: "#9b8cff", mint: "#55e6b1" } } }, plugins: [] } satisfies Config;
