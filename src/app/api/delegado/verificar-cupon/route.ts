import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const codigo = searchParams.get('codigo')

        if (!codigo) return NextResponse.json({ error: "Falta el código" }, { status: 400 })

        const cupon = await prisma.cupon.findUnique({
            where: { codigo: codigo.toUpperCase() }
        })

        if (!cupon) return NextResponse.json({ error: "Este código no existe." }, { status: 404 })
        if (cupon.usado) return NextResponse.json({ error: "Este cupón ya fue utilizado por alguien más." }, { status: 400 })

        // Retornamos el éxito
        return NextResponse.json({ codigo: cupon.codigo, monto: cupon.monto })

    } catch (error) {
        return NextResponse.json({ error: "Error al verificar el cupón" }, { status: 500 })
    }
}