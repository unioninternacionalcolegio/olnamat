// app/api/registro-libre/route.ts
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

        // 1. Validar que los campos obligatorios existan (DNI e Institución son obligatorios)
        if (!dni || !nombres || !apellidos || !institucion || !nivel || !gradoOEdad || !comprobanteUrl || !fechaPago || !horaPago) {
            return NextResponse.json({ error: "Faltan datos obligatorios, incluyendo DNI, colegio, fecha y hora del voucher." }, { status: 400 })
        }

        const finalDni = dni.trim()
        if (finalDni.length !== 8 || !/^\d{8}$/.test(finalDni)) {
            return NextResponse.json({ error: "El DNI ingresado no es válido. Debe tener exactamente 8 números." }, { status: 400 })
        }

        // 2A. Verificar que el DNI no esté registrado como Usuario
        const userExists = await prisma.user.findUnique({ where: { dni: finalDni } })
        if (userExists) {
            return NextResponse.json({ error: "Este DNI ya tiene una cuenta registrada en el sistema." }, { status: 400 })
        }

        // 2B. Verificar que el DNI no esté registrado como Estudiante
        const estudianteExists = await prisma.estudiante.findUnique({ where: { dni: finalDni } })
        if (estudianteExists) {
            return NextResponse.json({ error: "Este DNI ya se encuentra inscrito como estudiante en el concurso." }, { status: 400 })
        }

        // 3. Verificar que el Número de Operación sea ÚNICO (si el usuario lo ingresó)
        // CORRECCIÓN: Buscamos dentro de la nueva tabla Detalles
        if (numeroOperacion && numeroOperacion.trim() !== "") {
            const operacionExists = await prisma.pago.findFirst({
                where: {
                    detalles: {
                        some: {
                            numeroOperacion: numeroOperacion.trim()
                        }
                    }
                }
            })
            if (operacionExists) {
                return NextResponse.json({ error: "Este número de operación ya fue usado. Verifica tu comprobante." }, { status: 400 })
            }
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

        // 4. Ejecutar todo en una transacción
        const result = await prisma.$transaction(async (tx) => {
            // Crear el Usuario "Cliente"
            const newUser = await tx.user.create({
                data: {
                    dni: finalDni,
                    name: fullName.toUpperCase(),
                    password: hashedPassword,
                    celular: celular || null,
                    localidad: localidad ? localidad.toUpperCase() : "SIN ESPECIFICAR",
                    institucion: institucion.toUpperCase(), // Ya viene con LIBRE- desde el front
                    tipoColegio: TipoColegio.LIBRE,
                    role: Role.LIBRE,
                }
            })

            // Crear el Pago en estado PENDIENTE
            // CORRECCIÓN: Usando la nueva relación de detalles
            const nuevoPago = await tx.pago.create({
                data: {
                    montoTotal,
                    estado: EstadoPago.PENDIENTE,
                    tipoComprobante: TipoComprobante.TICKET_INTERNO,
                    clienteId: newUser.id,
                    detalles: {
                        create: [
                            {
                                metodo: MetodoPago.YAPE, // Asumimos digital por subir voucher
                                monto: montoTotal,
                                numeroOperacion: numeroOperacion ? numeroOperacion.trim() : null,
                                fechaHoraPago: fechaHoraCompleta,
                                comprobanteUrl: comprobanteUrl || null
                            }
                        ]
                    }
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
                    institucion: institucion.toUpperCase(), // Ya viene con LIBRE- desde el front
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