//app/api/configuracion/route.ts
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

        // Extraemos TODOS los campos nuevos, incluyendo los 6 precios y el turno
        const {
            id, nivel, gradoOEdad, turno, horaInicio, horaFin,
            costoEstatalReg, costoEstatalExt,
            costoParticularReg, costoParticularExt,
            costoLibreReg, costoLibreExt,
            cantidadPreguntas, puntosCorrecto, puntosIncorrecto, puntosBlanco
        } = body

        // Preparar los datos asegurándonos de que los números sean números
        const dataConfig = {
            nivel,
            gradoOEdad,
            turno: turno || "Turno 1",
            horaInicio,
            horaFin,
            costoEstatalReg: Number(costoEstatalReg),
            costoEstatalExt: Number(costoEstatalExt),
            costoParticularReg: Number(costoParticularReg),
            costoParticularExt: Number(costoParticularExt),
            costoLibreReg: Number(costoLibreReg),
            costoLibreExt: Number(costoLibreExt),
            cantidadPreguntas: Number(cantidadPreguntas),
            puntosCorrecto: Number(puntosCorrecto),
            puntosIncorrecto: Number(puntosIncorrecto),
            puntosBlanco: Number(puntosBlanco),
        }

        let resultado;

        // Si mandamos un ID, actualizamos. Si no, verificamos si ya existe ese nivel/grado y lo actualizamos
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