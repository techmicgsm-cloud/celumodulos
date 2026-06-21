import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voltrix ERP",
  description:
    "Gestión de importaciones de módulos de celulares: costos reales, precios sugeridos y stock.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
