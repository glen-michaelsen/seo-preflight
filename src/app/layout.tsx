import type { Metadata } from "next";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";

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
      <body>
        <NextTopLoader
          color="#4D5958"
          shadow="0 0 8px rgba(77,89,88,0.4)"
          height={3}
          showSpinner={false}
        />
        {children}
      </body>
    </html>
  );
}
