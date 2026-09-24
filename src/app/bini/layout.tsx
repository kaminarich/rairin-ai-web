import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "BINI Guild Shop — Rairin Telegram Web App",
  description:
    "Medieval RPG shop for the Rairin BINI game: spend MANA on rank protection, attack/defense boosts and shields. Earn MANA by salvaging BINI or converting rank points.",
};

export default function BiniLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
