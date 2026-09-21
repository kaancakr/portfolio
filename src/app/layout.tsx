import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eren Kaan Çakır — Software Engineer",
  description:
    "Software engineer working on API security, real-time systems, and developer tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
