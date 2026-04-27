import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.role !== "ADMINISTRADOR") {
            return NextResponse.json({ error: "Solo los administradores pueden configurar el concurso" }, { status: 403 })
        }

        const body = await req.json()
        const { id, nivel, gradoOEdad, costoRegular, costoExtemporaneo, cantidadPreguntas, puntosCorrecto, puntosIncorrecto, puntosBlanco, horaInicio, horaFin } = body

        // Preparar los datos
        const dataConfig = {
            nivel,
            gradoOEdad,
            costoRegular: Number(costoRegular),
            costoExtemporaneo: Number(costoExtemporaneo),
            cantidadPreguntas: Number(cantidadPreguntas),
            puntosCorrecto: Number(puntosCorrecto),
            puntosIncorrecto: Number(puntosIncorrecto),
            puntosBlanco: Number(puntosBlanco),
            horaInicio,
            horaFin
        }

        let resultado;

        // Si mandamos un ID, actualizamos. Si no, verificamos si ya existe ese nivel/grado y lo creamos o actualizamos
        const existe = await prisma.configuracionConcurso.findFirst({
            where: { nivel, gradoOEdad }
        })

        if (existe) {
            resultado = await prisma.configuracionConcurso.update({
                where: { id: existe.id },
                data: dataConfig
            })
        } else {
            resultado = await prisma.configuracionConcurso.create({
                data: dataConfig
            })
        }

        return NextResponse.json({ message: "Configuración guardada", resultado }, { status: 200 })

    } catch (error: any) {
        console.error("Error en configuración:", error)
        return NextResponse.json({ error: "Error al guardar la configuración" }, { status: 500 })
    }
}