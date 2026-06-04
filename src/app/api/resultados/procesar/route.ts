// app/api/resultados/procesar/route.ts
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

        // 4. Buscar al estudiante por DNI
        const estudiante = await prisma.estudiante.findUnique({
            where: { dni: dniEstudiante }
        });

        if (!estudiante) {
            return NextResponse.json({ error: `Estudiante con DNI ${dniEstudiante} no encontrado` }, { status: 404 });
        }

        // 5. Calcular el puntaje y ARMAR EL JSON DE RESPUESTAS DETALLADAS
        const claves = config.clavesRespuestas as any;
        let correctas = 0;
        let incorrectas = 0;
        let enBlanco = 0;

        // 💉 AQUÍ CREAMOS EL JSON QUE ALIMENTARÁ AL MODAL DEL FRONTEND
        const respuestasDetalle: any[] = [];

        respuestas.forEach((marcada: string, index: number) => {
            // Soportamos si el solucionario es un Array ["A", "B"] o un Objeto {"1":"A", "2":"B"}
            const correcta = Array.isArray(claves) ? claves[index] : claves[(index + 1).toString()];
            const numPregunta = index + 1;
            let estado = "INCORRECTA";
            let marcaFinal = marcada;

            if (!marcada || marcada === "BLANCO" || marcada === "") {
                enBlanco++;
                estado = "BLANCO";
                marcaFinal = "-";
            } else if (marcada === correcta) {
                correctas++;
                estado = "CORRECTA";
            } else {
                incorrectas++;
                estado = "INCORRECTA";
            }

            respuestasDetalle.push({
                pregunta: numPregunta,
                marcada: marcaFinal,
                estado: estado
            });
        });

        const puntajeTotal =
            (correctas * config.puntosCorrecto) -
            (incorrectas * Math.abs(config.puntosIncorrecto)) +
            (enBlanco * config.puntosBlanco);

        // 6. Formatear hora (Usamos UTC para blindar la hora exacta y no sufrir cambios de zona horaria)
        let fechaHoraSalida = null;
        if (horaSalida) {
            const [horasStr, minutosStr, segundosStr] = horaSalida.split(':');
            let horas = parseInt(horasStr, 10);
            const minutos = parseInt(minutosStr, 10);
            const segundos = parseInt(segundosStr || "0", 10);

            // 💉 MAGIA: Si la hora es 1, 2, 3, 4 o 5, la pasamos a formato 24h sumándole 12 (13, 14, 15, 16, 17)
            if (horas >= 1 && horas <= 5) {
                horas += 12;
            }

            const ahora = new Date();
            // setUTCHours fuerza a guardar los números literales que mandó Python, ya convertidos si aplicó
            ahora.setUTCHours(
                horas,
                minutos,
                segundos,
                0 // Milisegundos
            );
            fechaHoraSalida = ahora;
        }

        // 7. Guardar o actualizar el resultado en la BD (INCLUYENDO respuestasDetalle)
        const resultado = await prisma.resultadoExamen.upsert({
            where: { estudianteId: estudiante.id },
            update: {
                correctas,
                incorrectas,
                enBlanco,
                puntajeTotal,
                horaSalida: fechaHoraSalida,
                respuestasDetalle: respuestasDetalle, // 💉 GUARDAMOS EL JSON
            },
            create: {
                estudianteId: estudiante.id,
                correctas,
                incorrectas,
                enBlanco,
                puntajeTotal,
                horaSalida: fechaHoraSalida,
                respuestasDetalle: respuestasDetalle, // 💉 GUARDAMOS EL JSON
                revisadorId: null
            }
        });

        // 8. Devolver datos para que Python arme el Excel local
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
                horaSalida // Devuelve el string tal cual para el Excel de Python
            }
        });

    } catch (error) {
        console.error("Error procesando examen:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}