import prisma from "@/lib/prisma"
import DashboardClient from "./DashboardClient"
import { Nivel, TipoColegio } from "@prisma/client"

export default async function AdminDashboard() {
    // 1. Resumen Global (Dinero real en caja)
    const totalEstudiantes = await prisma.estudiante.count()
    const recaudacionTotal = await prisma.pago.aggregate({
        where: { estado: 'APROBADO' },
        _sum: { montoTotal: true }
    })

    // 2. Traer estudiantes con sus pagos prorrateados
    const estudiantes = await prisma.estudiante.findMany({
        include: {
            pago: {
                include: {
                    _count: { select: { estudiantes: true } }
                }
            }
        }
    })

    const configuraciones = await prisma.configuracionConcurso.findMany()
    const nivelesKey = ["INICIAL", "PRIMARIA", "SECUNDARIA"] as Nivel[]
    const tiposKey = ["ESTATAL", "PARTICULAR", "LIBRE"] as TipoColegio[]

    // 3. Totales por Tipo de Colegio para las tarjetas principales
    const totalesPorTipo = tiposKey.map(tipo => {
        const monto = estudiantes
            .filter(e => e.tipoColegio === tipo && e.pago?.estado === 'APROBADO')
            .reduce((acc, curr) => acc + (curr.pago!.montoTotal / curr.pago!._count.estudiantes), 0)

        return { tipo, monto: Math.round(monto * 100) / 100 }
    })

    // 4. Estadísticas detalladas
    const statsPorNivel = nivelesKey.map(nivel => {
        const estsNivel = estudiantes.filter(e => e.nivel === nivel)

        const detallesGrados = Array.from(new Set(configuraciones.filter(c => c.nivel === nivel).map(c => c.gradoOEdad))).map(grado => {
            const estsGrado = estsNivel.filter(e => e.gradoOEdad === grado)

            // Desglose por tipo dentro del grado
            const desglose = tiposKey.map(tipo => {
                const estsTipo = estsGrado.filter(e => e.tipoColegio === tipo)
                const monto = estsTipo
                    .filter(e => e.pago?.estado === 'APROBADO')
                    .reduce((acc, curr) => acc + (curr.pago!.montoTotal / curr.pago!._count.estudiantes), 0)

                return { tipo, cantidad: estsTipo.length, monto: Math.round(monto * 100) / 100 }
            })

            return {
                nombre: grado,
                inscritos: estsGrado.length,
                aprobados: estsGrado.filter(e => e.pago?.estado === 'APROBADO').length,
                recaudado: desglose.reduce((acc, d) => acc + d.monto, 0),
                desglose
            }
        })

        return {
            id: nivel,
            totalInscritos: estsNivel.length,
            recaudado: detallesGrados.reduce((acc, g) => acc + g.recaudado, 0),
            grados: detallesGrados
        }
    })

    return (
        <DashboardClient
            global={{
                totalInscritos: totalEstudiantes,
                totalRecaudado: recaudacionTotal._sum.montoTotal || 0,
                totalesPorTipo
            }}
            statsNiveles={statsPorNivel}
        />
    )
}