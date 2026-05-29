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
            descuento,
            montoTotal,
            numeroOperacion,
            fechaPago,
            horaPago,
            items,
            pagosParciales
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

            const detallesParaInsertar = pagosParciales && pagosParciales.length > 0
                ? pagosParciales.map((p: any) => ({
                    metodo: p.metodo,
                    monto: Number(p.monto),
                    numeroOperacion: p.numeroOperacion || null,
                    fechaHoraPago: p.fechaHoraPago ? new Date(p.fechaHoraPago) : new Date()
                }))
                : [
                    {
                        metodo: metodoPago as MetodoPago,
                        monto: montoTotal,
                        numeroOperacion: numeroOperacion || null,
                        fechaHoraPago: fechaPago && horaPago ? new Date(`${fechaPago}T${horaPago}`) : new Date()
                    }
                ];

            // CREACIÓN DEL PAGO MAESTRO
            const nuevoPago = await tx.pago.create({
                data: {
                    descuento: descuento || 0,
                    montoTotal: montoTotal,
                    tipoComprobante: TipoComprobante.TICKET_INTERNO,
                    clienteId,
                    cajeroId: cajeroId || null,
                    detalles: {
                        create: detallesParaInsertar
                    }
                }
            })

            const estudiantesData: any[] = []
            const timestampSeed = Date.now().toString().slice(-6);

            for (const item of items) {
                // 1. PRIMERO INGRESAMOS LOS ESTUDIANTES AGRUPADOS CON LA NUEVA LÓGICA MÚLTIPLE
                if (item.estudiantesAgrupados && item.estudiantesAgrupados.length > 0) {
                    for (const est of item.estudiantesAgrupados) {
                        estudiantesData.push({
                            nivel: item.nivel as Nivel,
                            gradoOEdad: item.gradoOEdad,
                            institucion: cliente.institucion || "POR COMPLETAR", // Si es LIBRE, el padre/primer chico ya tiene el prefijo LIBRE-
                            localidad: cliente.localidad || "POR COMPLETAR",
                            estadoRegistro: EstadoRegistro.COMPLETO,
                            dni: est.dni,
                            nombres: est.nombres,
                            apellidos: est.apellidos,
                            creadorId: clienteId,
                            pagoId: nuevoPago.id,
                            tipoColegio: item.tipoColegioItem as TipoColegio
                        })
                    }
                }

                // 2. LÓGICA DE RETROCOMPATIBILIDAD Y CUPOS RÁPIDOS
                const cantidadExplicitamenteAgregada = item.estudiantesAgrupados ? item.estudiantesAgrupados.length : 0;
                const restantePorLlenar = item.cantidad - cantidadExplicitamenteAgregada;

                for (let i = 0; i < restantePorLlenar; i++) {
                    // Si otra vista antigua manda estudianteNombres (en lugar del nuevo array), lo capturamos aquí en la vuelta i=0
                    const esRegistroViejoConDatos = item.estudianteNombres && i === 0 && cantidadExplicitamenteAgregada === 0;

                    let dniEstudiante = null;
                    let nombresEstudiante = null;
                    let apellidosEstudiante = null;
                    let estadoReg: EstadoRegistro = EstadoRegistro.INCOMPLETO;

                    if (esRegistroViejoConDatos) {
                        dniEstudiante = item.estudianteDni;
                        nombresEstudiante = item.estudianteNombres;
                        apellidosEstudiante = item.estudianteApellidos;
                        estadoReg = EstadoRegistro.COMPLETO;
                    } else if (item.tipoColegioItem === 'LIBRE') {
                        // DNI autogenerado para cupos rápidos sin nombre
                        dniEstudiante = `LIB-${timestampSeed}-${item.nivel.substring(0, 3)}-${i}-${Math.floor(Math.random() * 1000)}`;
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