import "./globals.css";
import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Blueberry Insight",
  description: "ATS léger, sobre et élégant."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${manrope.variable}`}>
      {children}
      </body>
    </html>
  );
}
