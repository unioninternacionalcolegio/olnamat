//app/api/configuracion/[id]/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Mantenemos la estructura de Promesa para params que exige Next.js 15+
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "ADMINISTRADOR") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        // Extraemos el id esperando a que se resuelva la promesa
        const { id } = await params

        await prisma.configuracionConcurso.delete({
            where: { id }
        })

        return NextResponse.json({ message: "Configuración eliminada" })
    } catch (error) {
        console.error("Error al eliminar configuración:", error)
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
    }
}