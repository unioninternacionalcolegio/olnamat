//app/api/pagos/[id]/verificar/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { EstadoPago } from "@prisma/client"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMINISTRADOR", "ASISTENTE"].includes(session.user.role)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const body = await req.json()
        const { estado } = body

        // 1. Extraemos el ID resolviendo la promesa en Next.js 15+
        const { id } = await params

        // 2. Validación extra de seguridad de los Enums
        if (!estado || !Object.values(EstadoPago).includes(estado)) {
            return NextResponse.json({ error: "Estado de pago no válido" }, { status: 400 })
        }

        // Preparar la data a actualizar
        const dataToUpdate: any = { estado: estado as EstadoPago }

        // Si se aprueba o rechaza, registramos QUIÉN lo hizo
        if (estado === "APROBADO" || estado === "RECHAZADO") {
            dataToUpdate.cajeroId = session.user.id
        }

        // 3. Actualizamos el estado y asignamos el cajero. 
        // IMPORTANTE: Incluimos 'detalles' y 'cajero' para que el Frontend actualice su estado completamente.
        const pagoActualizado = await prisma.pago.update({
            where: { id },
            data: dataToUpdate,
            include: {
                cajero: true,
                detalles: true // Garantiza que los depósitos parciales regresen al frontend
            }
        })

        return NextResponse.json({
            mensaje: `El ticket maestro fue ${estado} exitosamente.`,
            pago: pagoActualizado
        })
    } catch (error) {
        console.error("Error al actualizar el pago:", error)
        return NextResponse.json({ error: "Error interno al verificar el pago" }, { status: 500 })
    }
}