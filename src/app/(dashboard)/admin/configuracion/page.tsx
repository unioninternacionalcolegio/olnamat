// app/(dashboard)/admin/configuracion/page.tsx
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

    // Traemos los cupones desde la base de datos
    const cupones = await prisma.cupon.findMany({
        orderBy: { createdAt: 'desc' }
    })

    // 💉 NUEVO: Traemos los descuentos por colegio
    const descuentos = await prisma.descuentoColegio.findMany({
        orderBy: { createdAt: 'desc' }
    })

    // 💉 CORRECCIÓN TS: Quitamos el "not: null" del where. 
    // Prisma nos traerá los valores únicos y nosotros ignoramos los vacíos en el JS de abajo.
    const usuariosColegios = await prisma.user.findMany({
        select: { institucion: true },
        distinct: ['institucion']
    })

    const estudiantesColegios = await prisma.estudiante.findMany({
        select: { institucion: true },
        distinct: ['institucion']
    })

    const colegiosSet = new Set<string>()

    usuariosColegios.forEach(u => {
        if (u.institucion && u.institucion.trim() !== "") {
            colegiosSet.add(u.institucion.toUpperCase().replace("LIBRE-", "").trim())
        }
    })

    estudiantesColegios.forEach(e => {
        if (e.institucion && e.institucion.trim() !== "") {
            colegiosSet.add(e.institucion.toUpperCase().replace("LIBRE-", "").trim())
        }
    })

    const colegiosUnicos = Array.from(colegiosSet).sort()

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración del Concurso</h1>
                <p className="text-gray-600">Define los precios, cantidad de preguntas y reglas de calificación por cada grado.</p>
            </div>

            <PanelConfiguracion
                dataInicial={configuraciones}
                cuponesIniciales={cupones}
                descuentosIniciales={descuentos}
                colegiosSugeridos={colegiosUnicos}
            />
        </div>
    )
}