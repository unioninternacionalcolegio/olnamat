import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import VistaImpresion from "./VistaImpresion"

export default async function ImprimirPage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
    // 1. Desempaquetamos los searchParams con await
    const params = await searchParams

    // 2. Ahora ya podemos leer params.ids de forma segura
    if (!params.ids) {
        redirect("/admin/alumnos") // O redirige a /delegado dependiendo de dónde vengan
    }

    const idsArray = params.ids.split(",")

    // Obtenemos los estudiantes y verificamos que su pago esté aprobado
    const estudiantes = await prisma.estudiante.findMany({
        where: {
            id: { in: idsArray },
            estadoRegistro: 'COMPLETO',
            pago: {
                estado: 'APROBADO' // REGLA ESTRICTA: Solo aprobados
            }
        },
        orderBy: { apellidos: 'asc' }
    })

    if (estudiantes.length === 0) {
        return (
            <div className="p-8 text-center text-red-600 font-bold bg-red-50 rounded-xl">
                No se encontraron alumnos válidos para imprimir. Verifica que sus datos estén completos y su pago APROBADO.
            </div>
        )
    }

    return <VistaImpresion estudiantes={estudiantes} />
}