import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScamLens — Spot the scam",
  description:
    "Paste any shady message — ScamLens shows you the traps and tells you what to do, in your own language.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
