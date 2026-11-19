import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

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
      <body className="bg-black text-white min-h-screen antialiased select-text">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
