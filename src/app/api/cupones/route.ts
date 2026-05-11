import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const data = await req.json()

        // Validar que el código no exista ya
        const existente = await prisma.cupon.findUnique({
            where: { codigo: data.codigo }
        })

        if (existente) {
            return NextResponse.json({ error: "Ese código de cupón ya existe" }, { status: 400 })
        }

        const nuevoCupon = await prisma.cupon.create({
            data: {
                codigo: data.codigo,
                monto: data.monto,
                usado: false
            }
        })

        return NextResponse.json({ cupon: nuevoCupon }, { status: 201 })
    } catch (error) {
        console.error("Error en POST /api/cupones:", error)
        return NextResponse.json({ error: "Error al crear el cupón" }, { status: 500 })
    }
}