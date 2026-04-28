import { PrismaClient, Role, Nivel, EstadoPago, MetodoPago, EstadoRegistro, TipoComprobante, TipoColegio } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Iniciando el sembrado de datos (Seed)...")

    // 1. Encriptar la contraseña genérica (DNI o "12345678" para pruebas)
    const passwordAdmin = await bcrypt.hash("12345678", 10)
    const passwordDelegado = await bcrypt.hash("11111111", 10)

    // ==========================================
    // 2. CREAR USUARIOS DEL STAFF (ADMIN, CAJA, REVISOR)
    // ==========================================
    const admin = await prisma.user.upsert({
        where: { email: 'admin@olnamat.com' },
        update: {},
        create: {
            email: 'admin@olnamat.com',
            name: 'Admin Principal',
            password: passwordAdmin,
            role: Role.ADMINISTRADOR,
            dni: '00000000',
            tipoColegio: TipoColegio.ESTATAL
        },
    })

    const asistente = await prisma.user.upsert({
        where: { email: 'caja1@olnamat.com' },
        update: {},
        create: {
            email: 'caja1@olnamat.com',
            name: 'Secretaria Caja 1',
            password: passwordAdmin,
            role: Role.ASISTENTE,
            dni: '00000001',
            tipoColegio: TipoColegio.ESTATAL
        },
    })

    const revisador = await prisma.user.upsert({
        where: { email: 'revisor1@olnamat.com' },
        update: {},
        create: {
            email: 'revisor1@olnamat.com',
            name: 'Profesor Revisor',
            password: passwordAdmin,
            role: Role.REVISADOR,
            dni: '00000002',
            tipoColegio: TipoColegio.ESTATAL
        },
    })

    // ==========================================
    // 3. CREAR CONFIGURACIONES DE EXAMEN
    // ==========================================
    await prisma.configuracionConcurso.upsert({
        where: {
            nivel_grado_turno: {
                nivel: Nivel.INICIAL,
                gradoOEdad: '5 años',
                turno: 'Turno 1'
            }
        },
        update: {},
        create: {
            nivel: Nivel.INICIAL,
            gradoOEdad: '5 años',
            turno: 'Turno 1',
            horaInicio: '09:00',
            horaFin: '10:00',
            costoEstatalReg: 10, costoEstatalExt: 15,
            costoParticularReg: 12, costoParticularExt: 17,
            costoLibreReg: 15, costoLibreExt: 20,
            cantidadPreguntas: 10, puntosCorrecto: 10, puntosIncorrecto: -1, puntosBlanco: 0,
        }
    })

    await prisma.configuracionConcurso.upsert({
        where: {
            nivel_grado_turno: {
                nivel: Nivel.PRIMARIA,
                gradoOEdad: '6to Grado',
                turno: 'Turno 2'
            }
        },
        update: {},
        create: {
            nivel: Nivel.PRIMARIA,
            gradoOEdad: '6to Grado',
            turno: 'Turno 2',
            horaInicio: '10:30',
            horaFin: '12:00',
            costoEstatalReg: 12, costoEstatalExt: 17,
            costoParticularReg: 15, costoParticularExt: 20,
            costoLibreReg: 18, costoLibreExt: 25,
            cantidadPreguntas: 20, puntosCorrecto: 10, puntosIncorrecto: -1, puntosBlanco: 0,
        }
    })

    // ==========================================
    // 4. CREAR DELEGADO (PARTICULAR) Y SUS 15 ALUMNOS
    // ==========================================
    const delegado = await prisma.user.upsert({
        where: { dni: '11111111' },
        update: {},
        create: {
            dni: '11111111',
            name: 'Delegado Prueba',
            password: passwordDelegado,
            role: Role.DELEGADO,
            institucion: 'I.E. Santa Isabel',
            localidad: 'Huancayo',
            tipoColegio: TipoColegio.PARTICULAR // <-- Delegado de colegio particular
        }
    })

    const pagoDelegado = await prisma.pago.create({
        data: {
            montoTotal: 150,
            metodo: MetodoPago.TRANSFERENCIA,
            numeroOperacion: '999888777',
            estado: EstadoPago.APROBADO,
            clienteId: delegado.id,
            tipoComprobante: TipoComprobante.TICKET_INTERNO
        }
    })

    // 10 alumnos COMPLETOS
    for (let i = 1; i <= 10; i++) {
        await prisma.estudiante.create({
            data: {
                dni: `700000${i.toString().padStart(2, '0')}`,
                nombres: `Alumno ${i}`,
                apellidos: `Perez Delegado`,
                nivel: Nivel.PRIMARIA,
                gradoOEdad: '6to Grado',
                institucion: delegado.institucion || '',
                tipoColegio: TipoColegio.PARTICULAR, // <-- Heredan el tipo de colegio
                localidad: delegado.localidad || '',
                estadoRegistro: EstadoRegistro.COMPLETO,
                creadorId: delegado.id,
                pagoId: pagoDelegado.id
            }
        })
    }

    // 5 alumnos INCOMPLETOS
    for (let i = 1; i <= 5; i++) {
        await prisma.estudiante.create({
            data: {
                nivel: Nivel.INICIAL,
                gradoOEdad: '5 años',
                institucion: delegado.institucion || '',
                tipoColegio: TipoColegio.PARTICULAR, // <-- Heredan el tipo de colegio
                localidad: delegado.localidad || '',
                estadoRegistro: EstadoRegistro.INCOMPLETO,
                creadorId: delegado.id,
                pagoId: pagoDelegado.id
            }
        })
    }

    // ==========================================
    // 5. CREAR 5 LIBRES
    // ==========================================
    for (let i = 1; i <= 5; i++) {
        const dniLibre = `2222222${i}`
        const passwordLibre = await bcrypt.hash(dniLibre, 10)

        const libre = await prisma.user.upsert({
            where: { dni: dniLibre },
            update: {},
            create: {
                dni: dniLibre,
                name: `Libre ${i} Martinez`,
                password: passwordLibre,
                role: Role.LIBRE,
                institucion: 'Independiente',
                localidad: 'El Tambo',
                tipoColegio: TipoColegio.LIBRE // <-- Tipo de colegio LIBRE
            }
        })

        const pagoLibre = await prisma.pago.create({
            data: {
                montoTotal: 15,
                metodo: MetodoPago.YAPE,
                numeroOperacion: `YAPE-00${i}`,
                estado: EstadoPago.APROBADO,
                clienteId: libre.id,
                tipoComprobante: TipoComprobante.BOLETA
            }
        })

        await prisma.estudiante.create({
            data: {
                dni: `8000000${i}`,
                nombres: `Hijo Libre ${i}`,
                apellidos: `Martinez`,
                nivel: i % 2 === 0 ? Nivel.INICIAL : Nivel.PRIMARIA,
                gradoOEdad: i % 2 === 0 ? '5 años' : '6to Grado',
                institucion: libre.institucion || '',
                tipoColegio: TipoColegio.LIBRE, // <-- Estudiante Libre
                localidad: libre.localidad || '',
                estadoRegistro: EstadoRegistro.COMPLETO,
                creadorId: libre.id,
                pagoId: pagoLibre.id
            }
        })
    }

    console.log("✅ Seed completado con éxito. ¡Datos listos para probar!")
    console.log("--------------------------------------------------")
    console.log("🔑 Credenciales de prueba:")
    console.log("Admin: admin@olnamat.com | Pass: 12345678")
    console.log("Caja: caja1@olnamat.com | Pass: 12345678")
    console.log("Revisor: revisor1@olnamat.com | Pass: 12345678")
    console.log("Delegado DNI: 11111111 | Pass: 11111111 (Colegio Particular)")
    console.log("Libre DNI: 22222221 | Pass: 22222221 (Alumno Libre)")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })