import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role, TipoColegio, Nivel, MetodoPago, TipoComprobante, EstadoPago, EstadoRegistro } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            dni, nombres, apellidos, celular, localidad, institucion,
            nivel, gradoOEdad, numeroOperacion, fechaPago, horaPago, comprobanteUrl
        } = body

        if (!nombres || !apellidos || !nivel || !gradoOEdad || !comprobanteUrl || !fechaPago || !horaPago) {
            return NextResponse.json({ error: "Faltan datos obligatorios, incluyendo fecha y hora del voucher." }, { status: 400 })
        }

        // 1. Generar DNI si está vacío
        let finalDni = dni?.trim()
        if (!finalDni) {
            finalDni = `LIB-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`
        }

        // Verificar DNI
        const userExists = await prisma.user.findUnique({ where: { dni: finalDni } })
        if (userExists) {
            return NextResponse.json({ error: "Este DNI ya está registrado." }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(finalDni, 10)
        const fullName = `${nombres} ${apellidos}`

        // Construir la Fecha y Hora juntas para la BD
        const fechaHoraCompleta = new Date(`${fechaPago}T${horaPago}:00`)

        // Buscar el costo del concurso para guardar el monto exacto
        const config = await prisma.configuracionConcurso.findFirst({
            where: { nivel: nivel as Nivel, gradoOEdad }
        })
        const montoTotal = config ? config.costoLibreReg : 15 // Por defecto si no halla config

        // 2. Ejecutar todo en una transacción
        const result = await prisma.$transaction(async (tx) => {
            // Crear el Usuario "Cliente"
            const newUser = await tx.user.create({
                data: {
                    dni: finalDni,
                    name: fullName.toUpperCase(),
                    password: hashedPassword,
                    celular: celular || null,
                    localidad: localidad ? localidad.toUpperCase() : "SIN ESPECIFICAR",
                    institucion: institucion || "ALUMNO LIBRE", // Por seguridad lo forzamos aquí también
                    tipoColegio: TipoColegio.LIBRE,
                    role: Role.LIBRE,
                }
            })

            // Crear el Pago en estado PENDIENTE usando la fecha y hora unidas
            const nuevoPago = await tx.pago.create({
                data: {
                    montoTotal,
                    metodo: MetodoPago.YAPE, // Asumimos método digital por subir voucher
                    numeroOperacion: numeroOperacion || null,
                    fechaHoraPago: fechaHoraCompleta,
                    comprobanteUrl,
                    estado: EstadoPago.PENDIENTE,
                    tipoComprobante: TipoComprobante.TICKET_INTERNO,
                    clienteId: newUser.id,
                }
            })

            // Crear al Estudiante
            const nuevoEstudiante = await tx.estudiante.create({
                data: {
                    dni: finalDni,
                    nombres: nombres.toUpperCase(),
                    apellidos: apellidos.toUpperCase(),
                    nivel: nivel as Nivel,
                    gradoOEdad,
                    institucion: institucion || "ALUMNO LIBRE",
                    localidad: localidad ? localidad.toUpperCase() : "SIN ESPECIFICAR",
                    estadoRegistro: EstadoRegistro.COMPLETO,
                    creadorId: newUser.id,
                    pagoId: nuevoPago.id,
                    tipoColegio: TipoColegio.LIBRE
                }
            })

            return nuevoEstudiante
        })

        return NextResponse.json({
            message: "Registro completado con éxito",
            estudiante: result
        }, { status: 201 })

    } catch (error: any) {
        console.error("Error en registro público:", error)
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
    }
}