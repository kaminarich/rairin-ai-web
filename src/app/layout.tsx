import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "RaiRin-AI — AI-Integrated Root Module and Game Booster";
const description =
  "RaiRin-AI is a Magisk root module pairing an onboard AI assistant with a deep game booster engine. Snapdragon, MediaTek, Unisoc, Exynos and Tensor. Permanent per-device license from Rp 10.000 (about USD 1.30).";

export const metadata: Metadata = {
  metadataBase: new URL("https://rairin-ai-web.vercel.app"),
  title,
  description,
  applicationName: "RaiRin-AI",
  keywords: [
    "RaiRin-AI",
    "game booster",
    "Magisk module",
    "root module",
    "Android performance",
    "device spoofing",
    "Snapdragon",
    "MediaTek",
    "Unisoc",
    "Exynos",
    "Tensor",
  ],
  authors: [{ name: "kaminarich", url: "https://github.com/kaminarich" }],
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "RaiRin-AI",
    images: [{ url: "/banner.png", width: 1672, height: 941, alt: "RaiRin-AI" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/banner.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
