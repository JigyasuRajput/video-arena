import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Archivo carries a width axis, which is what lets the big uppercase headings
// sit slightly condensed and heavy like the refs without a second font file.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
});

// Full title template, OG image and theme colour come in spec 03.
export const metadata: Metadata = {
  title: "Video Arena",
  description:
    "A Higgsfield style AI video and image creation UI. Generation is simulated.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // `dark` is here only so shadcn's dark: utilities resolve. There is no
    // light theme to toggle to.
    <html
      lang="en"
      className={`dark ${inter.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
