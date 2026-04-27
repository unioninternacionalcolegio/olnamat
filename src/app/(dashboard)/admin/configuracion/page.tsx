import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import PanelConfiguracion from "./PanelConfiguracion"

export default async function ConfiguracionPage() {
    const session = await getServerSession(authOptions)

    // OJO: Seguridad primero, solo el admin entra aquí
    if (!session || session.user.role !== "ADMINISTRADOR") {
        redirect("/admin")
    }

    // Traemos todas las configuraciones ordenadas
    const configuraciones = await prisma.configuracionConcurso.findMany({
        orderBy: [
            { nivel: 'asc' },
            { gradoOEdad: 'asc' }
        ]
    })

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración del Concurso</h1>
                <p className="text-gray-600">Define los precios, cantidad de preguntas y reglas de calificación por cada grado.</p>
            </div>

            <PanelConfiguracion dataInicial={configuraciones} />
        </div>
    )
}