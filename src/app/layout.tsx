import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/context/TournamentContext";
import Navbar from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FPL Tournament Dashboard",
  description: "Friends Premier League Tournament Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen selection:bg-emerald-500/30`}>
        <TournamentProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </TournamentProvider>
      </body>
    </html>
  );
}
