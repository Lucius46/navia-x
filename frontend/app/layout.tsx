import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Navia-X (SBP) User Explainer",
  description: "User-facing web explainer with parsing modes and language selection."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
