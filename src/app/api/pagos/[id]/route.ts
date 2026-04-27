import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { EstadoPago } from "@prisma/client"

// Agregamos el Promise
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !["ADMINISTRADOR", "ASISTENTE"].includes(session.user.role)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const body = await req.json()
        const { estado } = body

        if (!estado || !Object.values(EstadoPago).includes(estado)) {
            return NextResponse.json({ error: "Estado de pago no válido" }, { status: 400 })
        }

        // Await params
        const { id } = await params

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