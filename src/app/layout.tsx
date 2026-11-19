import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Sotarium | Loans & Repayment Matrix",
  description: "High-tier crypto loan tracking, repayment progress, and milestone roadmaps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090a0f] text-slate-100 min-h-screen antialiased flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 min-h-screen relative overflow-y-auto">
          {/* Subtle cosmic background glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />
          {children}
        </main>
      </body>
    </html>
  );
}
