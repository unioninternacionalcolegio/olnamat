// src/app/layout.tsx
import type { Metadata } from "next"
import "./globals.css" // Aquí sí funciona porque están en la misma carpeta

export const metadata: Metadata = {
  title: "OLNAMAT - Sistema de Gestión",
  description: "Sistema para el concurso de matemáticas OLNAMAT",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased text-gray-900 bg-gray-50">
        {children}
      </body>
    </html>
  )
}