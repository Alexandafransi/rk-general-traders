import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RK General Traders | Mshirika wa Vodacom",
  description:
    "RK GENERAL TRADERS — mshirika wa biashara wa Vodacom Tanzania. Ufungaji wa router na fiber, na uuzaji wa vifaa halisi vya intaneti: router, wi-fi extenders, na mikrotik za vocha.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="sw"
      data-theme="dark"
      data-lang="sw"
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
