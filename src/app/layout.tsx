import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "USD Income Planner Argentina",
  description: "Planificador de ingresos USD para freelancers en Argentina",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
