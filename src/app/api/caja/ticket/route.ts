import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Nivel, MetodoPago, TipoComprobante, EstadoRegistro, TipoColegio } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            cajeroId,
            clienteId,
            metodoPago,
            montoTotal,
            numeroOperacion,
            fechaPago,
            horaPago,
            items
        } = body

        // Validaciones súper específicas para que sepas qué falla
        if (!clienteId) return NextResponse.json({ error: "Falta el ID del cliente (Delegado/Libre)." }, { status: 400 })
        if (!items || items.length === 0) return NextResponse.json({ error: "El carrito está vacío." }, { status: 400 })
        if (montoTotal === undefined) return NextResponse.json({ error: "Falta el monto total." }, { status: 400 })

        const cliente = await prisma.user.findUnique({
            where: { id: clienteId }
        })

        if (!cliente) {
            return NextResponse.json({ error: "El cliente seleccionado ya no existe en la base de datos." }, { status: 404 })
        }

        const result = await prisma.$transaction(async (tx) => {
            const nuevoPago = await tx.pago.create({
                data: {
                    montoTotal,
                    metodo: metodoPago as MetodoPago,
                    numeroOperacion: numeroOperacion || null,
                    fechaHoraPago: fechaPago && horaPago ? new Date(`${fechaPago}T${horaPago}`) : new Date(),
                    tipoComprobante: TipoComprobante.TICKET_INTERNO,
                    clienteId,
                    cajeroId: cajeroId || null // Si por alguna razón no llega, lo dejamos en null en vez de explotar
                }
            })

            const estudiantesData: any[] = []

            for (const item of items) {
                for (let i = 0; i < item.cantidad; i++) {
                    const esRegistroLibreConDatos = i === 0 && item.estudianteDni && item.estudianteNombres

                    estudiantesData.push({
                        nivel: item.nivel as Nivel,
                        gradoOEdad: item.gradoOEdad,
                        institucion: esRegistroLibreConDatos ? cliente.institucion : (cliente.institucion || "POR COMPLETAR"),
                        localidad: cliente.localidad || "POR COMPLETAR",
                        estadoRegistro: esRegistroLibreConDatos ? EstadoRegistro.COMPLETO : EstadoRegistro.INCOMPLETO,
                        dni: esRegistroLibreConDatos ? item.estudianteDni : null,
                        nombres: esRegistroLibreConDatos ? item.estudianteNombres : null,
                        apellidos: esRegistroLibreConDatos ? item.estudianteApellidos : null,
                        creadorId: clienteId,
                        pagoId: nuevoPago.id,
                        tipoColegio: item.tipoColegioItem as TipoColegio
                    })
                }
            }

            await tx.estudiante.createMany({
                data: estudiantesData
            })

            return nuevoPago
        })

        return NextResponse.json({
            message: "Venta procesada con éxito",
            ticket: result
        }, { status: 201 })

    } catch (error: any) {
        console.error("Error crítico en caja/ticket:", error)
        return NextResponse.json({ error: error.message || "Error interno del servidor al procesar venta" }, { status: 500 })
    }
}