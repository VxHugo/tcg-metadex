import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TCG MetaDex",
  description: "Coleção, scanner, preços e oportunidades para Pokémon TCG.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

