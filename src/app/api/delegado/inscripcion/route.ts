import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { EstadoPago, EstadoRegistro, TipoComprobante } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()
        const { estudiantes, montoTotal, tipoComprobante, codigoCupon, pagosParciales } = body

        if (!estudiantes || estudiantes.length === 0) {
            return NextResponse.json({ error: "Debe incluir al menos un estudiante" }, { status: 400 })
        }
        if (montoTotal === undefined || !pagosParciales) {
            return NextResponse.json({ error: "Faltan datos del pago o configuración de recibos." }, { status: 400 })
        }

        const creador = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!creador) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

        const resultado = await prisma.$transaction(async (tx) => {
            // A. LÓGICA DE CUPONES
            let descuentoReal = 0;
            let cuponUsadoId = null;

            if (codigoCupon) {
                const cupon = await tx.cupon.findUnique({ where: { codigo: codigoCupon } })
                if (!cupon) throw new Error("El código de cupón no existe.")
                if (cupon.usado) throw new Error("El cupón ya fue utilizado.")

                descuentoReal = cupon.monto;
                cuponUsadoId = cupon.id;

                await tx.cupon.update({
                    where: { id: cupon.id },
                    data: { usado: true }
                })
            }

            // Validar que no nos manden números de operación ya usados desde Postman/hack
            const numsOperacion = pagosParciales.map((p: any) => p.numeroOperacion).filter(Boolean);
            if (numsOperacion.length > 0) {
                const opsExistentes = await tx.detallePago.findMany({
                    where: { numeroOperacion: { in: numsOperacion } }
                });
                if (opsExistentes.length > 0) {
                    throw new Error(`Los números de operación: ${opsExistentes.map(o => o.numeroOperacion).join(", ")} ya están registrados.`);
                }
            }

            // Calculamos el monto final a guardar
            const montoFinal = Math.max(0, parseFloat(montoTotal) - descuentoReal);

            // B. Crear el recibo de Pago Maestro y sus Detalles (Pagos Parciales)
            const nuevoPago = await tx.pago.create({
                data: {
                    montoTotal: montoFinal,
                    descuento: descuentoReal,
                    cuponId: cuponUsadoId,
                    estado: EstadoPago.PENDIENTE,
                    tipoComprobante: tipoComprobante || TipoComprobante.BOLETA,
                    clienteId: creador.id,

                    // AQUÍ INSERTAMOS LOS MÚLTIPLES PAGOS
                    detalles: {
                        create: pagosParciales.map((p: any) => ({
                            metodo: p.metodo,
                            monto: p.monto,
                            numeroOperacion: p.numeroOperacion || null,
                            comprobanteUrl: p.comprobanteUrl || null,
                            fechaHoraPago: p.fechaHoraPago ? new Date(p.fechaHoraPago) : new Date() // Si agregaste el campo a Prisma
                        }))
                    }
                }
            })

            // C. Preparar e Insertar Estudiantes (Heredando el colegio dinámico del frontend)
            const estudiantesData = estudiantes.map((est: any) => {
                const estaCompleto = est.dni && est.nombres && est.apellidos

                return {
                    dni: est.dni || null,
                    nombres: est.nombres || null,
                    apellidos: est.apellidos || null,
                    nivel: est.nivel,
                    gradoOEdad: est.gradoOEdad,
                    // Usamos el colegio y tipo que editó el delegado, o el suyo por defecto
                    institucion: est.institucion || creador.institucion || 'Independiente',
                    tipoColegio: est.tipoColegio || creador.tipoColegio || 'ESTATAL',
                    localidad: creador.localidad || 'S/L',
                    estadoRegistro: estaCompleto ? EstadoRegistro.COMPLETO : EstadoRegistro.INCOMPLETO,
                    creadorId: creador.id,
                    pagoId: nuevoPago.id
                }
            })

            await tx.estudiante.createMany({
                data: estudiantesData
            })

            return nuevoPago
        })

        return NextResponse.json({ success: true, pagoId: resultado.id })

    } catch (error: any) {
        console.error("Error en API inscripción:", error)
        if (error.code === 'P2002' && error.meta?.target?.includes('dni')) {
            return NextResponse.json({ error: "Uno de los DNI ingresados ya está registrado." }, { status: 400 })
        }
        if (error.message.includes("cupón") || error.message.includes("operación")) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ error: "Error interno al procesar la inscripción" }, { status: 500 })
    }
}