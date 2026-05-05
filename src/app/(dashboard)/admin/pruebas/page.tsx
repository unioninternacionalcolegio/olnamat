// src/app/(dashboard)/admin/pruebas/page.tsx
import prisma from "@/lib/prisma"
import DashboardPruebasClient, { ConfiguracionDashboard } from "./DashboardPruebasClient"

export default async function PruebasPage() {
    // 1. Obtener configuraciones
    const configuraciones = await prisma.configuracionConcurso.findMany({
        orderBy: [
            { nivel: 'asc' },
            { gradoOEdad: 'asc' }
        ]
    })

    // 2. Contar estudiantes por grupo
    const estudiantesGrupos = await prisma.estudiante.groupBy({
        by: ['nivel', 'gradoOEdad'],
        _count: { id: true },
        where: { estadoRegistro: "COMPLETO" }
    })

    // 3. Mapear al tipo esperado por el cliente
    const configConConteos: ConfiguracionDashboard[] = configuraciones.map(config => {
        const grupo = estudiantesGrupos.find(
            g => g.nivel === config.nivel && g.gradoOEdad === config.gradoOEdad
        )

        return {
            id: config.id,
            nivel: config.nivel,
            gradoOEdad: config.gradoOEdad,
            cantidadPreguntas: config.cantidadPreguntas,
            clavesRespuestas: config.clavesRespuestas,
            cantidadEstudiantes: grupo?._count.id || 0
        }
    })

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Panel de Pruebas y Fichas Ópticas</h1>
                <p className="text-gray-500 mt-2">
                    Configura los solucionarios y genera las fichas ópticas para cada grado/edad.
                </p>
            </div>

            {/* Pasamos 'configuraciones' (plural) tal como lo definimos en el cliente */}
            <DashboardPruebasClient configuraciones={configConConteos} />
        </div>
    )
}