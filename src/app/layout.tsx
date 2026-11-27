import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  metadataBase: new URL("https://sotarium.vercel.app"),
  title: {
    default: "Sotarium",
    template: "%s | Sotarium",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/favicon.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="referrer" content="no-referrer" />
      </head>
      <body className="bg-black text-white min-h-screen antialiased select-text">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
