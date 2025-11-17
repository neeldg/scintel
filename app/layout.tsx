import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResearchNavigator",
  description: "AI assistant for PhD students and researchers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

