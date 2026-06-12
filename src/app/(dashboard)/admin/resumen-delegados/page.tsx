// app/(dashboard)/admin/resumen-delegados/page.tsx
import prisma from "@/lib/prisma"
import ResumenClient from "./ResumenClient"

export const dynamic = "force-dynamic" // Para que siempre traiga datos frescos

export default async function ResumenDelegadosPage() {
    // 1. Traemos a todos los usuarios que son DELEGADOS y hacemos un 'include' de sus estudiantes
    const delegadosDB = await prisma.user.findMany({
        where: {
            role: "DELEGADO"
        },
        include: {
            estudiantesInscritos: {
                select: {
                    gradoOEdad: true
                }
            }
        },
        orderBy: {
            name: "asc"
        }
    })

    // 2. Mapeamos y contamos los alumnos por grado para no saturar al frontend
    const delegadosMapeados = delegadosDB.map(delegado => {
        // Objeto para contar cuántos tiene por cada grado
        const conteoGrados: Record<string, number> = {}

        delegado.estudiantesInscritos.forEach(est => {
            const grado = est.gradoOEdad
            conteoGrados[grado] = (conteoGrados[grado] || 0) + 1
        })

        return {
            id: delegado.id,
            dni: delegado.dni || "SIN DNI",
            nombre: delegado.name || "SIN NOMBRE",
            colegio: delegado.institucion || "SIN COLEGIO",
            totalInscritos: delegado.estudiantesInscritos.length,
            conteoGrados
        }
    })

    return (
        <div className="p-6">
            <h1 className="text-3xl font-black mb-2 text-gray-800 uppercase tracking-tight">Resumen de Delegados</h1>
            <p className="text-gray-500 font-bold mb-6 text-sm">Visualiza y filtra la cantidad de inscritos por cada delegado y por grado.</p>
            
            {/* Pasamos la data procesada a nuestro componente de cliente */}
            <ResumenClient delegadosIniciales={delegadosMapeados} />
        </div>
    )
}