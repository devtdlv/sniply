import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const siteDescription =
  "Shorten links, track clicks, and share QR codes with a clean local dashboard.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: "Sniply",
  description: siteDescription,
  applicationName: "Sniply",
  openGraph: {
    title: "Sniply",
    description: siteDescription,
    type: "website",
    siteName: "Sniply",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sniply",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b6e4f",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${ibmPlexSans.className} antialiased`}
      >
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
