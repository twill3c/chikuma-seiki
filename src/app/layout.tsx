import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { FleetFooter } from "@/components/FleetFooter";
import { SITE } from "@/data/site";
import { SITE_URL, jsonLdScript, organizationJsonLd } from "@/lib/jsonld";

const zen = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-zen",
  display: "swap",
});

const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jp",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE.title, template: `%s | ${SITE.title}` },
  description: SITE.description,
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${zen.variable} ${mono.variable}`}>
      <body>
        {/* 架空である旨の明示 4 箇所のうちの 1 箇所(F-13)。機械に拾われる側 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(organizationJsonLd()),
          }}
        />
        <Header />
        <main>{children}</main>
        <SiteFooter />
        <FleetFooter />
      </body>
    </html>
  );
}
