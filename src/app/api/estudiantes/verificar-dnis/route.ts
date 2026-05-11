// app/api/estudiantes/verificar-dnis/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const { dnis } = await req.json()

        if (!Array.isArray(dnis) || dnis.length === 0) {
            return NextResponse.json({ registrados: [] })
        }

        // Filtramos para quitar DNIs vacíos
        const dnisValidos = dnis.filter(dni => dni && String(dni).trim() !== "")

        // Buscamos cuáles de esos DNIs ya existen en la base de datos
        const estudiantesExistentes = await prisma.estudiante.findMany({
            where: {
                dni: { in: dnisValidos }
            },
            select: { dni: true }
        })

        // Extraemos solo un arreglo con los strings de los DNIs
        const dnisRegistrados = estudiantesExistentes.map(e => e.dni)

        return NextResponse.json({ registrados: dnisRegistrados })
    } catch (error) {
        console.error("Error al verificar DNIs:", error)
        return NextResponse.json({ error: "Error interno al verificar DNIs" }, { status: 500 })
    }
}