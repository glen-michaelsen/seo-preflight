import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Preflight",
  description: "Analyse and monitor SEO health for your websites.",
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
