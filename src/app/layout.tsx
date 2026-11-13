import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { site } from "@/lib/config";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const archivo = Archivo({ subsets: ["latin"], display: "swap", variable: "--font-archivo", axes: ["wdth"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Event tickets in Zambia`, template: `%s | ${site.name}` },
  description:
    "Buy tickets for concerts, parties, conferences and events in Zambia with Airtel Money, MTN MoMo or Zamtel Kwacha. Organisers sell online and scan QR tickets at the door.",
  openGraph: { siteName: site.name, type: "website", images: ["/brand/zedtix-og.png"] },
};

export const viewport: Viewport = { themeColor: "#0b3b24" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
