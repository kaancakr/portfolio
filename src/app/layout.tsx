import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Fira_Code, Space_Mono } from 'next/font/google'

const firaCode = Fira_Code({ subsets: ['latin'] })
const spaceMono = Space_Mono({ 
  subsets: ['latin'],
  weight: ['400', '700']
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "~kaancakir",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${firaCode} ${spaceMono} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
