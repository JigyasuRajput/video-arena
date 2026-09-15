import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Fonts are the create-next-app defaults for now. Spec 01 swaps these for Inter
// plus a display face and replaces the token set in globals.css.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Full title template, OG image and theme colour come in spec 03.
export const metadata: Metadata = {
  title: "Video Arena",
  description:
    "A Higgsfield style AI video and image creation UI. Generation is simulated.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
