import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Shell } from "@/components/layout/shell";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Familienrezepte",
  description: "Dein digitales Familienkochbuch",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", rel: "shortcut icon" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rezepte",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-scroll-behavior="smooth">
      <body className={`${geist.variable} font-sans antialiased`}>
        <Shell>{children}</Shell>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
