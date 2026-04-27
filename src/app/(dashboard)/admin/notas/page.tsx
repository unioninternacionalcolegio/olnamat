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
            resultado: true // Traemos su nota si ya la tiene
        },
        orderBy: { apellidos: "asc" }
    })

    // 2. Obtener las reglas de calificación (Configuración)
    // Si no hay configuración en BD, el panel usará valores por defecto, 
    // pero lo ideal es tenerlas configuradas.
    const configuraciones = await prisma.configuracionConcurso.findMany()

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Subida de Notas y Resultados</h1>
                <p className="text-gray-600">Busca al alumno y digita su cantidad de respuestas correctas e incorrectas.</p>
            </div>

            <PanelNotas estudiantes={estudiantes} configuraciones={configuraciones} />
        </div>
    )
}