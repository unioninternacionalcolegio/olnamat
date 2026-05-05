import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        // 1. Verificación de Seguridad (API KEY)
        const authHeader = req.headers.get("authorization");
        const secretKey = process.env.OMR_SECRET_KEY || "mi_super_secreto_union_2026"; // Fallback para pruebas locales

        if (authHeader !== `Bearer ${secretKey}`) {
            return NextResponse.json({ error: "No autorizado. Token inválido." }, { status: 401 });
        }

        const body = await req.json();
        const { configuracionId, dniEstudiante, horaSalida, respuestas } = body;

        // 2. Validar que vengan los datos esenciales
        if (!configuracionId || !dniEstudiante || !respuestas) {
            return NextResponse.json({ error: "Faltan datos en la petición" }, { status: 400 });
        }

        // 3. Buscar la configuración y el solucionario
        const config = await prisma.configuracionConcurso.findUnique({
            where: { id: configuracionId }
        });

        if (!config || !config.clavesRespuestas) {
            return NextResponse.json({ error: "Solucionario no configurado para este examen" }, { status: 404 });
        }

        // 4. Buscar al estudiante por DNI (Asumiendo que DNI es único por concurso)
        const estudiante = await prisma.estudiante.findUnique({
            where: { dni: dniEstudiante }
        });

        if (!estudiante) {
            return NextResponse.json({ error: `Estudiante con DNI ${dniEstudiante} no encontrado` }, { status: 404 });
        }

        // 5. Calcular el puntaje comparando con el solucionario
        const claves = config.clavesRespuestas as string[];
        let correctas = 0;
        let incorrectas = 0;
        let enBlanco = 0;

        respuestas.forEach((marcada: string, index: number) => {
            const correcta = claves[index];

            if (!marcada || marcada === "BLANCO" || marcada === "") {
                enBlanco++;
            } else if (marcada === correcta) {
                correctas++;
            } else {
                incorrectas++;
            }
        });

        const puntajeTotal =
            (correctas * config.puntosCorrecto) -
            (incorrectas * Math.abs(config.puntosIncorrecto)) +
            (enBlanco * config.puntosBlanco);

        // Formatear hora de salida a formato Date para la DB
        let fechaHoraSalida = null;
        if (horaSalida) {
            const [horas, minutos] = horaSalida.split(':');
            const ahora = new Date();
            ahora.setHours(parseInt(horas, 10), parseInt(minutos, 10), 0, 0);
            fechaHoraSalida = ahora;
        }

        // 6. Guardar o actualizar el resultado en la BD
        const resultado = await prisma.resultadoExamen.upsert({
            where: { estudianteId: estudiante.id },
            update: {
                correctas,
                incorrectas,
                enBlanco,
                puntajeTotal,
                horaSalida: fechaHoraSalida,
            },
            create: {
                estudianteId: estudiante.id,
                correctas,
                incorrectas,
                enBlanco,
                puntajeTotal,
                horaSalida: fechaHoraSalida,
                revisadorId: null // Opcional: Podrías mandar el ID de la PC que revisó
            }
        });

        // 7. Devolver datos para que Python arme el Excel local
        return NextResponse.json({
            success: true,
            datos: {
                dni: estudiante.dni,
                nombres: estudiante.nombres,
                apellidos: estudiante.apellidos,
                colegio: estudiante.institucion,
                grado: estudiante.gradoOEdad,
                correctas,
                incorrectas,
                enBlanco,
                puntajeTotal,
                horaSalida
            }
        });

    } catch (error) {
        console.error("Error procesando examen:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}