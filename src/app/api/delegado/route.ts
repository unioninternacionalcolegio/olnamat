import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { EstadoPago, EstadoRegistro } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["DELEGADO", "REPRESENTANTE_IE"].includes(session.user.role)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const body = await req.json()
        const { alumnos, pagoInfo } = body

        // Buscamos al usuario completo en la BD
        const usuarioActual = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        // Iniciamos transacción
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Crear el Registro de Pago
            const nuevoPago = await tx.pago.create({
                data: {
                    montoTotal: Number(pagoInfo.montoTotal),
                    metodo: pagoInfo.metodo,
                    numeroOperacion: pagoInfo.numeroOperacion,
                    comprobanteUrl: pagoInfo.comprobanteUrl, // URL temporal o de Supabase
                    estado: EstadoPago.PENDIENTE,
                    clienteId: session.user.id,
                }
            })

            // 2. Crear todos los alumnos vinculados a ese pago
            const inscripciones = await Promise.all(
                alumnos.map((alum: any) =>
                    tx.estudiante.create({
                        data: {
                            dni: alum.dni || null,
                            nombres: alum.nombres || null,
                            apellidos: alum.apellidos || null,
                            nivel: alum.nivel,
                            gradoOEdad: alum.gradoOEdad,
                            institucion: usuarioActual?.institucion || "IE Particular",
                            localidad: usuarioActual?.localidad || "General",
                            estadoRegistro: (alum.dni && alum.nombres) ? EstadoRegistro.COMPLETO : EstadoRegistro.INCOMPLETO,
                            creadorId: session.user.id,
                            pagoId: nuevoPago.id
                        }
                    })
                )
            )

            return { pago: nuevoPago, total: inscripciones.length }
        })

        return NextResponse.json(resultado)
    } catch (error: any) {
        console.error(error)
        return NextResponse.json({ error: "Error procesando inscripción masiva" }, { status: 500 })
    }
}