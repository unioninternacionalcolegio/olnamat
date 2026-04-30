import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { EstadoPago, EstadoRegistro, TipoComprobante } from "@prisma/client"

export async function POST(req: Request) {
    try {
        // 1. Verificamos quién está haciendo la petición
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()
        const { estudiantes, comprobanteUrl, numeroOperacion, metodo, montoTotal, tipoComprobante } = body

        // 2. Validaciones básicas para que no nos manden basura
        if (!estudiantes || estudiantes.length === 0) {
            return NextResponse.json({ error: "Debe incluir al menos un estudiante" }, { status: 400 })
        }
        if (!metodo || !montoTotal) {
            return NextResponse.json({ error: "Faltan datos del pago" }, { status: 400 })
        }

        // 3. Traemos los datos del usuario logueado (para heredar el tipo de colegio a sus alumnos)
        const creador = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!creador) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

        // 4. TRANSACCIÓN: Guardamos el pago y los alumnos al mismo tiempo. 
        // Si uno falla, no se guarda nada (evita datos fantasma).
        const resultado = await prisma.$transaction(async (tx) => {

            // A. Crear el recibo de Pago en estado PENDIENTE
            const nuevoPago = await tx.pago.create({
                data: {
                    montoTotal: parseFloat(montoTotal),
                    metodo: metodo,
                    numeroOperacion: numeroOperacion || null,
                    comprobanteUrl: comprobanteUrl || null, // Aquí se guarda la foto que subiste
                    estado: EstadoPago.PENDIENTE,           // ¡Crucial! Para que la secretaria lo apruebe luego
                    tipoComprobante: tipoComprobante || TipoComprobante.BOLETA,
                    clienteId: creador.id,
                }
            })

            // B. Preparar la lista de estudiantes
            const estudiantesData = estudiantes.map((est: any) => {
                // Lógica inteligente: Si le falta algún dato clave, lo marcamos INCOMPLETO
                const estaCompleto = est.dni && est.nombres && est.apellidos

                return {
                    dni: est.dni || null,
                    nombres: est.nombres || null,
                    apellidos: est.apellidos || null,
                    nivel: est.nivel,
                    gradoOEdad: est.gradoOEdad,
                    // Heredan los datos del delegado o participante libre
                    institucion: creador.institucion || 'Independiente',
                    localidad: creador.localidad || 'S/L',
                    tipoColegio: creador.tipoColegio,
                    estadoRegistro: estaCompleto ? EstadoRegistro.COMPLETO : EstadoRegistro.INCOMPLETO,
                    creadorId: creador.id,
                    pagoId: nuevoPago.id // Enlazamos los niños a este voucher
                }
            })

            // C. Insertar todos los estudiantes de golpe a la base de datos
            await tx.estudiante.createMany({
                data: estudiantesData
            })

            return nuevoPago
        })

        return NextResponse.json({ success: true, pagoId: resultado.id })

    } catch (error: any) {
        console.error("Error en API inscripción:", error)

        // Si el prisma detecta que alguien intenta meter un DNI que ya existe
        if (error.code === 'P2002' && error.meta?.target?.includes('dni')) {
            return NextResponse.json({ error: "Uno de los DNI ingresados ya está registrado en el concurso." }, { status: 400 })
        }

        return NextResponse.json({ error: "Error interno del servidor al procesar la inscripción" }, { status: 500 })
    }
}