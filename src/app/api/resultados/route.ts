import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
// Ajusta esta ruta si tu authOptions está en otro lado
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

// ==========================================
// GET: OBTENER EL RANKING Y RESULTADOS
// ==========================================
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

        // 1. Traemos a TODOS los estudiantes de ese nivel y grado que tengan un resultado
        const estudiantes = await prisma.estudiante.findMany({
            where: {
                nivel: nivel as any,
                gradoOEdad: grado,
                resultado: { isNot: null } // Solo los que ya dieron examen
            },
            include: { resultado: true },
            // 2. LA MAGIA DEL RANKING: Ordenamos por mayor puntaje, y si empatan, por menor tiempo
            orderBy: [
                { resultado: { puntajeTotal: 'desc' } },
                { resultado: { horaSalida: 'asc' } }
            ]
        })

        // 3. Asignamos el PUESTO OFICIAL a cada uno
        let rankingOficial = estudiantes.map((est, index) => ({
            puesto: index + 1,
            id: est.id,
            dni: est.dni,
            nombres: est.nombres,
            apellidos: est.apellidos,
            institucion: est.institucion,
            tipoColegio: est.tipoColegio,
            creadorId: est.creadorId,
            correctas: est.resultado?.correctas || 0,
            incorrectas: est.resultado?.incorrectas || 0,
            enBlanco: est.resultado?.enBlanco || 0,
            puntajeTotal: est.resultado?.puntajeTotal || 0,
            horaSalida: est.resultado?.horaSalida
        }))

        // 4. Si NO es Staff, filtramos para que solo vea a sus propios alumnos
        const isStaff = ["ADMINISTRADOR", "ASISTENTE", "REVISADOR"].includes(session.user.role)

        if (!isStaff) {
            rankingOficial = rankingOficial.filter(est => est.creadorId === session.user.id)
        }

        return NextResponse.json(rankingOficial)
    } catch (error) {
        console.error("Error en API Resultados:", error)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}


// ==========================================
// POST: SUBIR O ACTUALIZAR NOTAS
// ==========================================
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        // Verificamos que sea un usuario autorizado para subir notas
        if (!session || !["ADMINISTRADOR", "ASISTENTE", "REVISADOR"].includes(session.user.role)) {
            return NextResponse.json({ error: "No tienes permiso para subir resultados" }, { status: 401 })
        }

        const body = await req.json()

        // Hacemos que funcione tanto si subes de a un alumno (formulario) o varios de golpe (Excel)
        const datos = Array.isArray(body) ? body : [body]

        if (datos.length === 0) {
            return NextResponse.json({ error: "No hay datos para guardar" }, { status: 400 })
        }

        // Usamos una transacción con upsert para crear o actualizar el resultado sin que crashee
        const resultadosGuardados = await prisma.$transaction(
            datos.map((dato: any) =>
                prisma.resultadoExamen.upsert({
                    where: { estudianteId: dato.estudianteId },
                    update: {
                        correctas: Number(dato.correctas || 0),
                        incorrectas: Number(dato.incorrectas || 0),
                        enBlanco: Number(dato.enBlanco || 0),
                        puntajeTotal: Number(dato.puntajeTotal || 0),
                        horaSalida: dato.horaSalida ? new Date(dato.horaSalida) : null,
                        revisadorId: session.user.id
                    },
                    create: {
                        estudianteId: dato.estudianteId,
                        correctas: Number(dato.correctas || 0),
                        incorrectas: Number(dato.incorrectas || 0),
                        enBlanco: Number(dato.enBlanco || 0),
                        puntajeTotal: Number(dato.puntajeTotal || 0),
                        horaSalida: dato.horaSalida ? new Date(dato.horaSalida) : null,
                        revisadorId: session.user.id
                    }
                })
            )
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