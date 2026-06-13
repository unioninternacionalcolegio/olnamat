// app/api/resultados/premiacion-colegios/route.ts
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
            const key = `${est.nivel}|${est.gradoOEdad}`; // Usamos | como separador seguro
            if (!porGrado[key]) porGrado[key] = [];
            porGrado[key].push(est);
        }

        // Mapas para el ACUMULADO GENERAL
        const mapGeneralNetos = new Map<string, { colegio: string; puntaje: number; cantidad: number }>();
        const mapGeneralLibres = new Map<string, { colegio: string; puntaje: number; cantidad: number }>();
        const mapGeneralTotal = new Map<string, { colegio: string; puntaje: number; cantidad: number }>();

        // Array para guardar el detalle separado por grado
        const detallePorGrado: any[] = [];

        // 3. Procesar cada grupo (Nivel-Grado)
        for (const key in porGrado) {
            const [nivel, grado] = key.split('|');
            const alumnos = porGrado[key];

            // Ordenar por puntaje (Mayor a menor) y luego por tiempo
            alumnos.sort((a, b) => {
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
            const top10 = alumnos.slice(0, 10);

            // Mapas específicos para ESTE grado
            const mapGradoNetos = new Map<string, { colegio: string; puntaje: number; cantidad: number }>();
            const mapGradoLibres = new Map<string, { colegio: string; puntaje: number; cantidad: number }>();
            const mapGradoTotal = new Map<string, { colegio: string; puntaje: number; cantidad: number }>();

            // 4. Acumular puntajes
            for (const est of top10) {
                const instOriginal = est.institucion?.toUpperCase().trim() || "DESCONOCIDO";
                const isLibre = instOriginal.startsWith("LIBRE-") || instOriginal.startsWith("LIBRE ");

                let instBase = instOriginal;
                if (isLibre) {
                    instBase = instOriginal.replace("LIBRE-", "").replace("LIBRE ", "").trim();
                }

                const puntaje = est.resultado!.puntajeTotal;

                // Función helper para sumar en un mapa
                const sumarMapa = (mapa: Map<string, any>, clave: string, nombreCole: string) => {
                    const actual = mapa.get(clave) || { colegio: nombreCole, puntaje: 0, cantidad: 0 };
                    actual.puntaje += puntaje;
                    actual.cantidad += 1;
                    mapa.set(clave, actual);
                };

                // Sumar al ACUMULADO GENERAL
                sumarMapa(mapGeneralTotal, instBase, instBase);
                if (isLibre) sumarMapa(mapGeneralLibres, instOriginal, instOriginal);
                else sumarMapa(mapGeneralNetos, instOriginal, instOriginal);

                // Sumar al ESPECÍFICO DEL GRADO
                sumarMapa(mapGradoTotal, instBase, instBase);
                if (isLibre) sumarMapa(mapGradoLibres, instOriginal, instOriginal);
                else sumarMapa(mapGradoNetos, instOriginal, instOriginal);
            }

            // Guardar el consolidado de este grado
            const sortFn = (a: any, b: any) => b.puntaje - a.puntaje;
            detallePorGrado.push({
                id: key,
                nivel,
                grado,
                netos: Array.from(mapGradoNetos.values()).sort(sortFn),
                libres: Array.from(mapGradoLibres.values()).sort(sortFn),
                total: Array.from(mapGradoTotal.values()).sort(sortFn),
            });
        }

        // 5. Ordenar el General
        const sortFn = (a: any, b: any) => b.puntaje - a.puntaje;

        return NextResponse.json({
            success: true,
            data: {
                general: {
                    netos: Array.from(mapGeneralNetos.values()).sort(sortFn),
                    libres: Array.from(mapGeneralLibres.values()).sort(sortFn),
                    total: Array.from(mapGeneralTotal.values()).sort(sortFn),
                },
                porGrado: detallePorGrado.sort((a, b) => a.id.localeCompare(b.id)) // Ordenar alfabéticamente por nivel/grado
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