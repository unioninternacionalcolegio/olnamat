// app/api/estudiantes/impresiones/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const { ids } = await req.json()

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "IDs inválidos" }, { status: 400 })
        }

        // Sumamos +1 al contador de impresiones de todos los IDs seleccionados
        await prisma.estudiante.updateMany({
            where: { id: { in: ids } },
            data: { impresiones: { increment: 1 } }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error al registrar impresión:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}