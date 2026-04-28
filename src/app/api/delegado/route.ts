import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { EstadoPago, EstadoRegistro } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        // Verificamos sesión y roles permitidos
        if (!session || !["ADMINISTRADOR", "DELEGADO", "REPRESENTANTE_IE", "LIBRE"].includes(session.user.role)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const body = await req.json()
        const { alumnos, pagoInfo } = body

        // Buscamos al usuario completo para obtener sus datos por defecto (localidad, tipoColegio, etc.)
        const usuarioActual = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        // Iniciamos la transacción para que si algo falla, no se guarde ni el pago ni los alumnos
        const resultado = await prisma.$transaction(async (tx) => {

            // 1. Crear el Registro de Pago
            const nuevoPago = await tx.pago.create({
                data: {
                    montoTotal: Number(pagoInfo.montoTotal),
                    metodo: pagoInfo.metodo,
                    numeroOperacion: pagoInfo.numeroOperacion,
                    comprobanteUrl: pagoInfo.comprobanteUrl,
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
                            nombres: alum.nombres?.toUpperCase() || null,
                            apellidos: alum.apellidos?.toUpperCase() || null,
                            nivel: alum.nivel,
                            gradoOEdad: alum.gradoOEdad,

                            // PRIORIDAD: 1. El colegio del alumno | 2. El colegio del delegado | 3. Genérico
                            institucion: (alum.institucion || usuarioActual?.institucion || "IE Particular").toUpperCase(),

                            // PRIORIDAD: 1. El tipo de colegio del alumno | 2. El del delegado | 3. ESTATAL
                            tipoColegio: alum.tipoColegio || usuarioActual?.tipoColegio || "ESTATAL",

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
        console.error("Error en Inscripción Masiva:", error)
        return NextResponse.json({ error: "Error procesando la inscripción" }, { status: 500 })
    }
}