import { PrismaClient, Role, Nivel, TipoColegio } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log("🧹 1. Limpiando la base de datos de pruebas...")

    // Limpieza de datos antiguos para empezar de cero
    await prisma.resultadoExamen.deleteMany()
    await prisma.estudiante.deleteMany()
    await prisma.detallePago.deleteMany()
    await prisma.pago.deleteMany()
    await prisma.cupon.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()

    console.log("🔄 2. Reiniciando el correlativo de tickets a T001...")
    try {
        await prisma.$executeRaw`ALTER SEQUENCE "Pago_correlativo_seq" RESTART WITH 1;`
    } catch (error) {
        console.log("Nota: Secuencia lista.")
    }

    console.log("🌱 3. Creando personal del Staff uno por uno...")

    // =========================================================================
    // A. ADMINISTRADORES (6 usuarios)
    // =========================================================================
    
    // Admin 1
    const dniAdmin1 = "45092216" // 👈 REEMPLAZA AQUÍ EL DNI REAL
    await prisma.user.create({
        data: {
            email: "josueriveros@olnamat.com", // 👈 REEMPLAZA AQUÍ EL CORREO REAL
            name: "Josue Riveros Conozco",      // 👈 REEMPLAZA AQUÍ EL NOMBRE
            password: await bcrypt.hash(dniAdmin1, 10),
            role: Role.ADMINISTRADOR,
            dni: dniAdmin1,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Admin 2
    const dniAdmin2 = "70765052"
    await prisma.user.create({
        data: {
            email: "enocs@olnamat.com",
            name: "Enoc Salazar Ortega",
            password: await bcrypt.hash(dniAdmin2, 10),
            role: Role.ADMINISTRADOR,
            dni: dniAdmin2,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Admin 3
    const dniAdmin3 = "72854875"
    await prisma.user.create({
        data: {
            email: "gersonb@olnamat.com",
            name: "Gerson Barrientos",
            password: await bcrypt.hash(dniAdmin3, 10),
            role: Role.ADMINISTRADOR,
            dni: dniAdmin3,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Admin 4
    const dniAdmin4 = "40919662"
    await prisma.user.create({
        data: {
            email: "eferriveros@olnamat.com",
            name: "Efer Riveros Conozco",
            password: await bcrypt.hash(dniAdmin4, 10),
            role: Role.ADMINISTRADOR,
            dni: dniAdmin4,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Admin 5
    const dniAdmin5 = "42491667"
    await prisma.user.create({
        data: {
            email: "hidroroveros@olnamat.com",
            name: "Hidro Riveros Conozco",
            password: await bcrypt.hash(dniAdmin5, 10),
            role: Role.ADMINISTRADOR,
            dni: dniAdmin5,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Admin 6
    const dniAdmin6 = "123456"
    await prisma.user.create({
        data: {
            email: "admin6@olnamat.com",
            name: "Administrador 6",
            password: await bcrypt.hash(dniAdmin6, 10),
            role: Role.ADMINISTRADOR,
            dni: dniAdmin6,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    console.log("✅ Administradores creados.")

    // =========================================================================
    // B. ASISTENTES / CAJA (4 usuarios)
    // =========================================================================
    
    // Asistente 1
    const dniCaja1 = "71644086"
    await prisma.user.create({
        data: {
            email: "delmira@olnamat.com",
            name: "Delmira Sandy Huaripata Lorenzo",
            password: await bcrypt.hash(dniCaja1, 10),
            role: Role.ASISTENTE,
            dni: dniCaja1,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Asistente 2
    const dniCaja2 = "40823043"
    await prisma.user.create({
        data: {
            email: "sadithruiz@olnamat.com",
            name: "Sadith Ruiz Atencio",
            password: await bcrypt.hash(dniCaja2, 10),
            role: Role.ASISTENTE,
            dni: dniCaja2,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Asistente 3
    const dniCaja3 = "48512433"
    await prisma.user.create({
        data: {
            email: "rosarioveliz@olnamat.com",
            name: "Rosario Veliz Esteban",
            password: await bcrypt.hash(dniCaja3, 10),
            role: Role.ASISTENTE,
            dni: dniCaja3,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Asistente 4
    const dniCaja4 = "148268070"
    await prisma.user.create({
        data: {
            email: "jhonpriale@olnamat.com",
            name: "Jhonn Robert Priale Villaverde",
            password: await bcrypt.hash(dniCaja4, 10),
            role: Role.ASISTENTE,
            dni: dniCaja4,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    console.log("✅ Asistentes de caja creados.")

    // =========================================================================
    // C. REVISADORES (6 usuarios)
    // =========================================================================
    
    // Revisor 1
    const dniRevisor1 = "74898556"
    await prisma.user.create({
        data: {
            email: "diego@olnamat.com",
            name: "Diego Barrientos Espinoza",
            password: await bcrypt.hash(dniRevisor1, 10),
            role: Role.REVISADOR,
            dni: dniRevisor1,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Revisor 2
    const dniRevisor2 = "48268070"
    await prisma.user.create({
        data: {
            email: "jhonprialevillaverde@olnamat.com",
            name: "Jhonn Robert Priale Villaverde",
            password: await bcrypt.hash(dniRevisor2, 10),
            role: Role.REVISADOR,
            dni: dniRevisor2,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Revisor 3
    const dniRevisor3 = "3123456"
    await prisma.user.create({
        data: {
            email: "revisor3@olnamat.com",
            name: "Profesor Revisor 3",
            password: await bcrypt.hash(dniRevisor3, 10),
            role: Role.REVISADOR,
            dni: dniRevisor3,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Revisor 4
    const dniRevisor4 = "31234567"
    await prisma.user.create({
        data: {
            email: "revisor4@olnamat.com",
            name: "Profesor Revisor 4",
            password: await bcrypt.hash(dniRevisor4, 10),
            role: Role.REVISADOR,
            dni: dniRevisor4,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Revisor 5
    const dniRevisor5 = "312345678"
    await prisma.user.create({
        data: {
            email: "revisor5@olnamat.com",
            name: "Profesor Revisor 5",
            password: await bcrypt.hash(dniRevisor5, 10),
            role: Role.REVISADOR,
            dni: dniRevisor5,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    // Revisor 6
    const dniRevisor6 = "3123456789"
    await prisma.user.create({
        data: {
            email: "revisor6@olnamat.com",
            name: "Profesor Revisor 6",
            password: await bcrypt.hash(dniRevisor6, 10),
            role: Role.REVISADOR,
            dni: dniRevisor6,
            tipoColegio: TipoColegio.ESTATAL
        }
    })

    console.log("✅ Revisadores creados.")

    // =========================================================================
    // D. CONFIGURACIÓN DE CONCURSOS (Mapeo exacto de tu tabla)
    // =========================================================================
    console.log("⏳ 4. Verificando/Restaurando configuración de concursos...")
    
    const configData = [
        { nivel: Nivel.INICIAL, gradoOEdad: '3 años', turno: 'SEGUNDO', horaInicio: '09:45', horaFin: '10:30', cantPreguntas: 10 },
        { nivel: Nivel.INICIAL, gradoOEdad: '4 años', turno: 'SEGUNDO', horaInicio: '09:45', horaFin: '10:30', cantPreguntas: 10 },
        { nivel: Nivel.INICIAL, gradoOEdad: '5 años', turno: 'SEGUNDO', horaInicio: '09:45', horaFin: '10:30', cantPreguntas: 10 },
        
        { nivel: Nivel.PRIMARIA, gradoOEdad: '1er Grado', turno: 'PRIMERO', horaInicio: '08:30', horaFin: '09:45', cantPreguntas: 15 },
        { nivel: Nivel.PRIMARIA, gradoOEdad: '2do Grado', turno: 'PRIMERO', horaInicio: '08:30', horaFin: '09:15', cantPreguntas: 15 },
        { nivel: Nivel.PRIMARIA, gradoOEdad: '3er Grado', turno: 'PRIMERO', horaInicio: '08:30', horaFin: '09:15', cantPreguntas: 15 },
        { nivel: Nivel.PRIMARIA, gradoOEdad: '4to Grado', turno: 'TERCERO', horaInicio: '11:00', horaFin: '11:45', cantPreguntas: 15 },
        { nivel: Nivel.PRIMARIA, gradoOEdad: '5to Grado', turno: 'TERCERO', horaInicio: '11:00', horaFin: '11:45', cantPreguntas: 15 },
        { nivel: Nivel.PRIMARIA, gradoOEdad: '6to Grado', turno: 'TERCERO', horaInicio: '11:00', horaFin: '11:45', cantPreguntas: 15 },
        
        { nivel: Nivel.SECUNDARIA, gradoOEdad: '1er Año', turno: 'CUARTO', horaInicio: '12:15', horaFin: '13:00', cantPreguntas: 15 },
        { nivel: Nivel.SECUNDARIA, gradoOEdad: '2do Año', turno: 'CUARTO', horaInicio: '12:15', horaFin: '01:00', cantPreguntas: 15 },
        { nivel: Nivel.SECUNDARIA, gradoOEdad: '3er Año', turno: 'QUINTO', horaInicio: '13:30', horaFin: '14:15', cantPreguntas: 15 },
        { nivel: Nivel.SECUNDARIA, gradoOEdad: '4to Año', turno: 'QUINTO', horaInicio: '13:30', horaFin: '14:15', cantPreguntas: 15 },
        { nivel: Nivel.SECUNDARIA, gradoOEdad: '5to Año', turno: 'QUINTO', horaInicio: '13:30', horaFin: '14:15', cantPreguntas: 15 },
    ];

    for (const conf of configData) {
        await prisma.configuracionConcurso.upsert({
            where: {
                nivel_grado_turno: {
                    nivel: conf.nivel,
                    gradoOEdad: conf.gradoOEdad,
                    turno: conf.turno
                }
            },
            update: {}, // Deja los costos y llaves tal cual están en la BD si ya existen
            create: {
                nivel: conf.nivel,
                gradoOEdad: conf.gradoOEdad,
                turno: conf.turno,
                horaInicio: conf.horaInicio,
                horaFin: conf.horaFin,
                costoEstatalReg: 13, costoEstatalExt: 15,
                costoParticularReg: 15, costoParticularExt: 17,
                costoLibreReg: 15, costoLibreExt: 17,
                cantidadPreguntas: conf.cantPreguntas, 
                puntosCorrecto: 10, puntosIncorrecto: -1, puntosBlanco: 0,
            }
        });
    }
    console.log("✅ Configuración de concursos asegurada e intacta.")

    console.log("--------------------------------------------------")
    console.log("🎉 SEED LISTO: Modifica los campos arriba y ejecútalo.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })