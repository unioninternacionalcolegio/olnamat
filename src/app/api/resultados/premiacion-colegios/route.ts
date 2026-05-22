import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // 1. Obtener todos los estudiantes que tienen un resultado de examen registrado
        const estudiantes = await prisma.estudiante.findMany({
            where: {
                resultado: {
                    isNot: null,
                },
            },
            include: {
                resultado: true,
            },
        });

        // 2. Agrupar por nivel y gradoOEdad
        const porGrado: Record<string, typeof estudiantes> = {};
        for (const est of estudiantes) {
            const key = `${est.nivel}-${est.gradoOEdad}`;
            if (!porGrado[key]) porGrado[key] = [];
            porGrado[key].push(est);
        }

        const topEstudiantes = [];

        // 3. Ordenar cada grupo y extraer los 10 primeros puestos
        for (const key in porGrado) {
            const alumnos = porGrado[key];
            alumnos.sort((a, b) => {
                // Ordenar por puntaje (Mayor a menor)
                const puntajeA = a.resultado!.puntajeTotal;
                const puntajeB = b.resultado!.puntajeTotal;

                if (puntajeA !== puntajeB) {
                    return puntajeB - puntajeA;
                }

                // Desempate por horaSalida (el que entregó primero, menor tiempo)
                const tiempoA = a.resultado!.horaSalida ? new Date(a.resultado!.horaSalida).getTime() : Infinity;
                const tiempoB = b.resultado!.horaSalida ? new Date(b.resultado!.horaSalida).getTime() : Infinity;

                return tiempoA - tiempoB;
            });

            // Tomamos solo los 10 primeros de este grado
            topEstudiantes.push(...alumnos.slice(0, 10));
        }

        // 4. Mapas para acumular puntajes según la categoría
        const mapNetos = new Map<string, { colegio: string; puntaje: number; cantidad: number }>();
        const mapLibres = new Map<string, { colegio: string; puntaje: number; cantidad: number }>();
        const mapTotal = new Map<string, { colegio: string; puntaje: number; cantidad: number }>();

        // 5. Iterar sobre los top estudiantes y agrupar sumatorias
        for (const est of topEstudiantes) {
            const instOriginal = est.institucion?.toUpperCase().trim() || "DESCONOCIDO";
            // Detectamos si es de la categoría Libre
            const isLibre = instOriginal.startsWith("LIBRE-") || instOriginal.startsWith("LIBRE ");

            // Obtenemos el nombre base para el consolidado (Ej: "LIBRE-ZARATE" -> "ZARATE")
            let instBase = instOriginal;
            if (isLibre) {
                instBase = instOriginal.replace("LIBRE-", "").replace("LIBRE ", "").trim();
            }

            const puntaje = est.resultado!.puntajeTotal;

            // --- A. Sumar al TOTAL COMBINADO ---
            const currTotal = mapTotal.get(instBase) || { colegio: instBase, puntaje: 0, cantidad: 0 };
            currTotal.puntaje += puntaje;
            currTotal.cantidad += 1;
            mapTotal.set(instBase, currTotal);

            // --- B. Sumar a NETOS o LIBRES según corresponda ---
            if (isLibre) {
                const currLibre = mapLibres.get(instOriginal) || { colegio: instOriginal, puntaje: 0, cantidad: 0 };
                currLibre.puntaje += puntaje;
                currLibre.cantidad += 1;
                mapLibres.set(instOriginal, currLibre);
            } else {
                const currNeto = mapNetos.get(instOriginal) || { colegio: instOriginal, puntaje: 0, cantidad: 0 };
                currNeto.puntaje += puntaje;
                currNeto.cantidad += 1;
                mapNetos.set(instOriginal, currNeto);
            }
        }

        // 6. Función para ordenar de mayor a menor puntaje
        const sortFn = (a: any, b: any) => b.puntaje - a.puntaje;

        // 7. Convertir mapas a arrays ordenados
        const rankingNetos = Array.from(mapNetos.values()).sort(sortFn);
        const rankingLibres = Array.from(mapLibres.values()).sort(sortFn);
        const rankingTotal = Array.from(mapTotal.values()).sort(sortFn);

        return NextResponse.json({
            success: true,
            data: {
                netos: rankingNetos,
                libres: rankingLibres,
                total: rankingTotal,
            },
        });
    } catch (error) {
        console.error("Error al generar premiación de colegios:", error);
        return NextResponse.json(
            { success: false, message: "Error interno al procesar los rankings" },
            { status: 500 }
        );
    }
}