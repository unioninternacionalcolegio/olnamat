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
        const { estudiantes, comprobanteUrl, numeroOperacion, metodo, montoTotal, tipoComprobante, codigoCupon } = body

        if (!estudiantes || estudiantes.length === 0) {
            return NextResponse.json({ error: "Debe incluir al menos un estudiante" }, { status: 400 })
        }
        if (!metodo || montoTotal === undefined) { // Cambiado a undefined para permitir pago 0
            return NextResponse.json({ error: "Faltan datos del pago" }, { status: 400 })
        }

        const creador = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!creador) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

        const resultado = await prisma.$transaction(async (tx) => {
            // A. LÓGICA DE CUPONES (¡NUEVO!)
            let descuentoReal = 0;
            let cuponUsadoId = null;

            if (codigoCupon) {
                // Verificamos si el cupón existe y es válido
                const cupon = await tx.cupon.findUnique({
                    where: { codigo: codigoCupon }
                })

                if (!cupon) throw new Error("El código de cupón no existe.")
                if (cupon.usado) throw new Error("El cupón ya fue utilizado.")

                descuentoReal = cupon.monto;
                cuponUsadoId = cupon.id;

                // Marcamos el cupón como usado AHORA MISMO dentro de la transacción
                await tx.cupon.update({
                    where: { id: cupon.id },
                    data: { usado: true }
                })
            }

            // Calculamos el monto final a guardar (por si mandaron un total hackeado desde el frontend)
            const montoFinal = Math.max(0, parseFloat(montoTotal) - descuentoReal);

            // B. Crear el recibo de Pago
            const nuevoPago = await tx.pago.create({
                data: {
                    montoTotal: montoFinal,
                    descuento: descuentoReal,          // Guardamos cuánto se descontó
                    cuponId: cuponUsadoId,             // Vinculamos el cupón al pago
                    metodo: metodo,
                    numeroOperacion: numeroOperacion || null,
                    comprobanteUrl: comprobanteUrl || null,
                    estado: EstadoPago.PENDIENTE,
                    tipoComprobante: tipoComprobante || TipoComprobante.BOLETA,
                    clienteId: creador.id,
                }
            })

            // C. Preparar la lista de estudiantes
            const estudiantesData = estudiantes.map((est: any) => {
                const estaCompleto = est.dni && est.nombres && est.apellidos

                return {
                    dni: est.dni || null,
                    nombres: est.nombres || null,
                    apellidos: est.apellidos || null,
                    nivel: est.nivel,
                    gradoOEdad: est.gradoOEdad,
                    institucion: creador.institucion || 'Independiente',
                    localidad: creador.localidad || 'S/L',
                    tipoColegio: creador.tipoColegio,
                    estadoRegistro: estaCompleto ? EstadoRegistro.COMPLETO : EstadoRegistro.INCOMPLETO,
                    creadorId: creador.id,
                    pagoId: nuevoPago.id
                }
            })

            // D. Insertar estudiantes
            await tx.estudiante.createMany({
                data: estudiantesData
            })

            return nuevoPago
        })

        return NextResponse.json({ success: true, pagoId: resultado.id })

    } catch (error: any) {
        console.error("Error en API inscripción:", error)

        if (error.code === 'P2002' && error.meta?.target?.includes('dni')) {
            return NextResponse.json({ error: "Uno de los DNI ingresados ya está registrado en el concurso." }, { status: 400 })
        }

        // Devolver el mensaje de error personalizado del cupón si es el caso
        if (error.message.includes("cupón")) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ error: "Error interno del servidor al procesar la inscripción" }, { status: 500 })
    }
}