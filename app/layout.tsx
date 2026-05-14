import "./globals.css";
import type { Metadata } from "next";
import { Inter, Inter_Tight, Fraunces } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  weight: ["500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  style: ["italic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Zebra Data — The connective tissue for healthcare data",
  description:
    "Zebra Data unifies fragmented patient records across EMRs, labs, pharmacies, and claims into a single intelligent Patient 360.",
  icons: {
    icon: [
      {
        url:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><clipPath id="z"><path d="M5 5 L35 5 L35 12 L16 28 L35 28 L35 35 L5 35 L5 28 L24 12 L5 12 Z"/></clipPath></defs><g clip-path="url(%23z)"><rect width="40" height="40" fill="%230A1628"/><rect y="11.2" width="40" height="1.6" fill="%23FAFAF7"/><rect y="19.2" width="40" height="1.6" fill="%23FAFAF7"/><rect y="27.2" width="40" height="1.6" fill="%23FAFAF7"/></g></svg>',
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
