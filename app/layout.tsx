import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Three Games In", description: "A multiplayer bingo board for game night." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
