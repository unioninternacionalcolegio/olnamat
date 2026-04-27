import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Nivel, MetodoPago, EstadoRegistro } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.role !== "ADMINISTRADOR" && session.user.role !== "ASISTENTE")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const body = await req.json()
        const { clienteId, items, metodoPago, montoTotal } = body

        if (!clienteId || !items || items.length === 0) {
            return NextResponse.json({ error: "Faltan datos para procesar la venta" }, { status: 400 })
        }

        // Obtener datos del cliente para heredar su institución/localidad a los cupos
        const cliente = await prisma.user.findUnique({ where: { id: clienteId } })
        if (!cliente) throw new Error("Cliente no encontrado")

        // Iniciar una Transacción: Todo o nada
        const resultado = await prisma.$transaction(async (tx) => {
            // 1. Crear el Ticket (Pago)
            const nuevoPago = await tx.pago.create({
                data: {
                    montoTotal: Number(montoTotal),
                    metodo: metodoPago as MetodoPago,
                    clienteId: cliente.id,
                    cajeroId: session.user.id,
                    estado: "APROBADO", // Si se cobra en caja, entra aprobado automáticamente
                    tipoComprobante: "TICKET_INTERNO",
                }
            })

            // 2. Preparar los "Cupos en blanco" (Estudiantes INCOMPLETOS)
            const estudiantesData = []

            for (const item of items) {
                for (let i = 0; i < item.cantidad; i++) {
                    estudiantesData.push({
                        nivel: item.nivel as Nivel,
                        gradoOEdad: item.gradoOEdad,
                        institucion: cliente.institucion || "Por rellenar",
                        localidad: cliente.localidad || "Por rellenar",
                        estadoRegistro: EstadoRegistro.INCOMPLETO, // CLAVE: Quedan pendientes de datos
                        creadorId: cliente.id,
                        pagoId: nuevoPago.id
                    })
                }
            }

            // 3. Insertar todos los cupos de golpe
            await tx.estudiante.createMany({
                data: estudiantesData
            })

            return nuevoPago
        })

        return NextResponse.json({
            message: "Venta procesada con éxito",
            ticket: { serie: resultado.serie, correlativo: resultado.correlativo, id: resultado.id }
        }, { status: 201 })

    } catch (error: any) {
        console.error("Error en Caja:", error)
        return NextResponse.json({ error: "Error procesando la venta" }, { status: 500 })
    }
}