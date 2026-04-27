import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        // Solo Administradores y Revisadores pueden subir notas
        if (!session || (session.user.role !== "ADMINISTRADOR" && session.user.role !== "REVISADOR")) {
            return NextResponse.json({ error: "No tienes permisos para calificar" }, { status: 403 })
        }

        const body = await req.json()
        const { estudianteId, correctas, incorrectas, enBlanco, puntajeTotal, horaSalida } = body

        if (!estudianteId) {
            return NextResponse.json({ error: "Falta el ID del estudiante" }, { status: 400 })
        }

        // Upsert: Si ya tiene nota, la actualiza (Edición). Si no, la crea.
        const resultado = await prisma.resultadoExamen.upsert({
            where: {
                estudianteId: estudianteId
            },
            update: {
                correctas: Number(correctas),
                incorrectas: Number(incorrectas),
                enBlanco: Number(enBlanco),
                puntajeTotal: Number(puntajeTotal),
                horaSalida: horaSalida ? new Date(horaSalida) : null,
                revisadorId: session.user.id // Guardamos quién fue el último que lo editó
            },
            create: {
                estudianteId: estudianteId,
                correctas: Number(correctas),
                incorrectas: Number(incorrectas),
                enBlanco: Number(enBlanco),
                puntajeTotal: Number(puntajeTotal),
                horaSalida: horaSalida ? new Date(horaSalida) : null,
                revisadorId: session.user.id
            }
        })

        return NextResponse.json({ message: "Nota guardada correctamente", resultado }, { status: 200 })

    } catch (error: any) {
        console.error("Error guardando nota:", error)
        return NextResponse.json({ error: "Error interno procesando la calificación" }, { status: 500 })
    }
}