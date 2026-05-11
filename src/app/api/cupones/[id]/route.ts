import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params   // ← Esto es lo más importante

        // Verificar si el cupón existe
        const cupon = await prisma.cupon.findUnique({
            where: { id }
        })

        if (!cupon) {
            return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 })
        }

        // No permitir eliminar cupones ya usados
        if (cupon.usado) {
            return NextResponse.json({
                error: "No se puede eliminar un cupón que ya fue usado."
            }, { status: 400 })
        }

        await prisma.cupon.delete({
            where: { id }
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("Error en DELETE /api/cupones/[id]:", error)
        return NextResponse.json({
            error: "Error al eliminar el cupón"
        }, { status: 500 })
    }
}