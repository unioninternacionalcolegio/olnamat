//app/(dashboard)/admin/notas/page.tsx
//app/(dashboard)/admin/notas/page.tsx
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import PanelNotas from "./PanelNotas"

export default async function NotasPage() {
    const session = await getServerSession(authOptions)

    if (!session || !["ADMINISTRADOR", "REVISADOR"].includes(session.user.role)) {
        redirect("/admin")
    }

    // 1. Obtener todos los estudiantes que ya tienen sus datos COMPLETOS
    const estudiantes = await prisma.estudiante.findMany({
        where: { estadoRegistro: "COMPLETO" },
        include: {
            resultado: true, // Traemos su nota si ya la tiene
            pago: true       // NUEVO: Traemos el pago para saber si es PENDIENTE
        },
        orderBy: { apellidos: "asc" }
    })

    // 2. Obtener las reglas de calificación (Configuración)
    const configuraciones = await prisma.configuracionConcurso.findMany()

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Subida de Notas y Resultados</h1>
                <p className="text-gray-600">Busca al alumno, digita las correctas e incorrectas, y usa la tecla TAB para navegar rápido.</p>
            </div>

            <PanelNotas estudiantes={estudiantes} configuraciones={configuraciones} />
        </div>
    )
}