import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// 1. Cambiamos el tipo a Promise<{ id: string }>
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "ADMINISTRADOR") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        // 2. Extraemos el id esperando a que se resuelva la promesa
        const { id } = await params

        await prisma.configuracionConcurso.delete({
            where: { id }
        })

        return NextResponse.json({ message: "Configuración eliminada" })
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
    }
}