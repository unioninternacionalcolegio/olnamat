// src/app/api/caja/ticket/route.ts
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
            subtotal,
            descuento,
            montoTotal,
            numeroOperacion,
            fechaPago,
            horaPago,
            items
        } = body

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
                    // ELIMINAMOS subtotal porque no está en el schema de Prisma
                    descuento: descuento || 0, // Si te da error, debes agregar la columna "descuento" a tu tabla Pago en schema.prisma
                    montoTotal: montoTotal,
                    metodo: metodoPago as MetodoPago,
                    numeroOperacion: numeroOperacion || null,
                    fechaHoraPago: fechaPago && horaPago ? new Date(`${fechaPago}T${horaPago}`) : new Date(),
                    tipoComprobante: TipoComprobante.TICKET_INTERNO,
                    clienteId,
                    cajeroId: cajeroId || null
                }
            })

            const estudiantesData: any[] = []
            const timestampSeed = Date.now().toString().slice(-6);

            for (const item of items) {
                for (let i = 0; i < item.cantidad; i++) {
                    const esRegistroLibreConDatos = item.estudianteNombres && i === 0;

                    let dniEstudiante = null;
                    let nombresEstudiante = null;
                    let apellidosEstudiante = null;

                    // CORRECCIÓN TS: Declaramos explícitamente que es del tipo enum EstadoRegistro
                    let estadoReg: EstadoRegistro = EstadoRegistro.INCOMPLETO;

                    if (esRegistroLibreConDatos) {
                        dniEstudiante = item.estudianteDni;
                        nombresEstudiante = item.estudianteNombres;
                        apellidosEstudiante = item.estudianteApellidos;
                        estadoReg = EstadoRegistro.COMPLETO;
                    } else if (item.tipoColegioItem === 'LIBRE') {
                        dniEstudiante = `LIB-${timestampSeed}-${i}-${Math.floor(Math.random() * 1000)}`;
                    }

                    estudiantesData.push({
                        nivel: item.nivel as Nivel,
                        gradoOEdad: item.gradoOEdad,
                        institucion: item.estudianteInstitucion || cliente.institucion || "POR COMPLETAR",
                        localidad: cliente.localidad || "POR COMPLETAR",
                        estadoRegistro: estadoReg,
                        dni: dniEstudiante,
                        nombres: nombresEstudiante,
                        apellidos: apellidosEstudiante,
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