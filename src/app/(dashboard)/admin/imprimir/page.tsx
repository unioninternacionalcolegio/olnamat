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

    // 3. Obtenemos los estudiantes y verificamos que su pago esté aprobado
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

    // 4. TRAEMOS LAS CONFIGURACIONES (AQUÍ ESTÁN LOS TURNOS)
    const configuraciones = await prisma.configuracionConcurso.findMany()

    // 5. LA MAGIA: Le inyectamos el turno a cada estudiante
    const estudiantesParaImprimir = estudiantes.map(est => {
        // Buscamos la regla de su grado y nivel
        const config = configuraciones.find(
            c => c.nivel === est.nivel && c.gradoOEdad === est.gradoOEdad
        )

        return {
            ...est,
            turno: config ? config.turno : "Sin Turno" // <-- Se lo pegamos aquí
        }
    })

    // 6. Mandamos los estudiantes ya "vitaminados" con su turno
    return <VistaImpresion estudiantes={estudiantesParaImprimir} />
}