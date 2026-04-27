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

        // 1. Extraemos el ID esperando la promesa (Fix para el error de Build)
        const { id } = await params

        // 2. Validación extra de seguridad
        if (!estado || !Object.values(EstadoPago).includes(estado)) {
            return NextResponse.json({ error: "Estado de pago no válido" }, { status: 400 })
        }

        // 3. Actualizamos solo el estado
        const pagoActualizado = await prisma.pago.update({
            where: { id },
            data: {
                estado: estado as EstadoPago
            }
        })

        return NextResponse.json(pagoActualizado)
    } catch (error) {
        console.error("Error al actualizar el pago:", error)
        return NextResponse.json({ error: "Error al verificar pago" }, { status: 500 })
    }
}