// src/app/api/resultados/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const nivel = searchParams.get("nivel")
        const grado = searchParams.get("grado")

        if (!nivel || !grado) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
        }

        // 1. Traemos la configuración para obtener la plantilla de respuestas (claves)
        const config = await prisma.configuracionConcurso.findFirst({
            where: { nivel: nivel as any, gradoOEdad: grado }
        })

        // 2. Traemos a los estudiantes con su resultado (incluyendo respuestasDetalle)
        let estudiantes = await prisma.estudiante.findMany({
            where: {
                nivel: nivel as any,
                gradoOEdad: grado,
                resultado: { isNot: null }
            },
            include: { resultado: true }
        })

        // 3. Filtro de seguridad: Si NO es Staff, solo ve a sus propios alumnos
        const isStaff = ["ADMINISTRADOR", "ASISTENTE", "REVISADOR"].includes(session.user.role)
        if (!isStaff) {
            estudiantes = estudiantes.filter(est => est.creadorId === session.user.id)
        }

        // Devolvemos la data cruda, el FRONTEND se encargará de ordenar, filtrar y rankear en vivo.
        return NextResponse.json({
            estudiantes,
            clavesRespuestas: config?.clavesRespuestas || {}
        })
    } catch (error) {
        console.error("Error en API Resultados:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !["ADMINISTRADOR", "ASISTENTE", "REVISADOR"].includes(session.user.role)) {
            return NextResponse.json({ error: "No tienes permiso para subir resultados" }, { status: 401 })
        }

        const body = await req.json()
        const datos = Array.isArray(body) ? body : [body]

        if (datos.length === 0) {
            return NextResponse.json({ error: "No hay datos para guardar" }, { status: 400 })
        }

        const resultadosGuardados = await prisma.$transaction(
            datos.map((dato: any) => {

                // 💉 MAGIA HORARIA: Restamos 5 horas exactas para forzar la Hora Perú en la DB
                let horaAjustada = null;
                if (dato.horaSalida) {
                    const fecha = new Date(dato.horaSalida);
                    fecha.setHours(fecha.getHours() - 5);
                    horaAjustada = fecha;
                }

                return prisma.resultadoExamen.upsert({
                    where: { estudianteId: dato.estudianteId },
                    update: {
                        correctas: Number(dato.correctas || 0),
                        incorrectas: Number(dato.incorrectas || 0),
                        enBlanco: Number(dato.enBlanco || 0),
                        puntajeTotal: Number(dato.puntajeTotal || 0),
                        horaSalida: horaAjustada, // 💉 Aplicamos la hora ajustada
                        respuestasDetalle: dato.respuestasDetalle || null,
                        revisadorId: session.user.id
                    },
                    create: {
                        estudianteId: dato.estudianteId,
                        correctas: Number(dato.correctas || 0),
                        incorrectas: Number(dato.incorrectas || 0),
                        enBlanco: Number(dato.enBlanco || 0),
                        puntajeTotal: Number(dato.puntajeTotal || 0),
                        horaSalida: horaAjustada, // 💉 Aplicamos la hora ajustada
                        respuestasDetalle: dato.respuestasDetalle || null,
                        revisadorId: session.user.id
                    }
                })
            })
        )

        return NextResponse.json({
            message: "Resultados guardados con éxito",
            procesados: resultadosGuardados.length
        }, { status: 201 })

    } catch (error) {
        console.error("Error en POST Resultados:", error)
        return NextResponse.json({ error: "Error interno del servidor al procesar resultados" }, { status: 500 })
    }
}