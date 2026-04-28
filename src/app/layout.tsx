import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import ConfigureAmplifyClientSide from "@/lib/amplify/client";
import { Toaster } from 'sonner';

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "OurWedding",
  description: "Your perfect day, perfectly planned.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable} font-body antialiased`}>
        <ConfigureAmplifyClientSide />
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  );
}
