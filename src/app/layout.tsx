import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Dashboard | Soteria",
  description: "Your activity across Soteria at a glance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex antialiased select-text">
        <Sidebar />
        <div className="flex-1 ml-[260px] min-h-screen flex flex-col bg-ambient">
          <Header />
          <main className="p-8 max-w-[1240px] w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
