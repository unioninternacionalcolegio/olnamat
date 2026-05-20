// app/api/pagos/verificar/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const operacion = searchParams.get("operacion")

        if (!operacion) {
            return NextResponse.json({ existe: false })
        }

        // Buscamos en los detalles de pago si existe ese número de operación
        const existePago = await prisma.detallePago.findFirst({
            where: {
                numeroOperacion: operacion.trim()
            }
        })

        return NextResponse.json({ existe: !!existePago })
    } catch (error) {
        console.error("Error verificando operación:", error)
        return NextResponse.json({ existe: false, error: "Error de servidor" }, { status: 500 })
    }
}