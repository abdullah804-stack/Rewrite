import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CommandPalette } from "./CommandPalette";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    template: "%s | Rewrite",
    default: "Rewrite — A free writing workspace",
  },
  description:
    "Make AI-assisted drafts sound natural. Paste text for an instant rewrite, or teach it your own voice so every draft matches it, with your facts protected.",
  metadataBase: new URL(process.env.AUTH_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="bg-surface-base text-text-primary font-sans">
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}