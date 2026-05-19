import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `${site.name} - ${site.slogan}`,
    template: `%s - ${site.name}`
  },
  description: site.description,
  icons: {
    icon: "/brand/dalleup-icon.svg",
    apple: "/brand/dalleup-icon.svg"
  },
  openGraph: {
    title: `${site.name} - ${site.slogan}`,
    description: site.description,
    images: ["/brand/dalleup-logo-slogan.svg"]
  },
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#ff6b1a"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
