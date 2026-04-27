import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { EstadoRegistro } from "@prisma/client"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()
        const { dni, nombres, apellidos, nivel, gradoOEdad, institucion, localidad } = body

        const { id } = await params // Await aquí

        if (dni) {
            const existeDni = await prisma.estudiante.findFirst({
                where: { dni, id: { not: id } }
            })
            if (existeDni) return NextResponse.json({ error: "El DNI ya está registrado en otro alumno" }, { status: 400 })
        }

        const estudianteActualizado = await prisma.estudiante.update({
            where: { id },
            data: {
                dni, nombres, apellidos, nivel, gradoOEdad, institucion, localidad,
                estadoRegistro: (dni && nombres && apellidos) ? EstadoRegistro.COMPLETO : EstadoRegistro.INCOMPLETO
            }
        })

        return NextResponse.json(estudianteActualizado)
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar el estudiante" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { id } = await params // Await aquí

        const tieneNotas = await prisma.resultadoExamen.findUnique({
            where: { estudianteId: id }
        })

        if (tieneNotas && session.user.role !== 'ADMINISTRADOR') {
            return NextResponse.json({ error: "No se puede eliminar un alumno que ya tiene resultados procesados" }, { status: 400 })
        }

        await prisma.estudiante.delete({ where: { id } })
        return NextResponse.json({ message: "Estudiante eliminado correctamente" })
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
    }
}