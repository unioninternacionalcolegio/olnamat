// src/app/(dashboard)/layout.tsx
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import { Printer } from "lucide-react" // IMPORTACIÓN NECESARIA

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar userRole={session.user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">

        <header className="bg-white border-b h-16 flex items-center justify-between px-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Panel de Control</h2>

          <div className="flex items-center space-x-4">
            {/* BOTÓN DE IMPRESIÓN SOLO PARA DELEGADOS (Perfectamente alineado en el header) */}
            {session.user.role === "DELEGADO" && (
              <a
                href="/delegado/imprimir-carnet"
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title="Imprimir Mi Carnet"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Imprimir Carnet</span>
              </a>
            )}

            <div className="h-6 border-l border-gray-300 hidden sm:block"></div>

            <span className="text-sm text-gray-600 font-medium">Hola, {session.user.name}</span>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {session.user.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}