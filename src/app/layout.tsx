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
  title: "Wedding Steward",
  description: "Modern wedding planning and coordination",
};

/**
 * The global root layout for the application.
 * 
 * This component is responsible for:
 * 1. Initializing global typography (Playfair Display, DM Sans).
 * 2. Setting up the base HTML document structure.
 * 3. Loading the client-side AWS Amplify configuration via `ConfigureAmplifyClientSide`.
 * 4. Providing a global Toaster instance for notifications.
 *
 * @param props.children - The child components or route pages to be rendered within the layout.
 * @returns The global HTML shell for the application.
 */
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
