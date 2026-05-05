
// app/api/configuracion/solucionario/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, clavesRespuestas } = body;

        if (!id || !clavesRespuestas) {
            return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
        }

        // Actualizamos el array JSON en la base de datos
        const configActualizada = await prisma.configuracionConcurso.update({
            where: { id },
            data: {
                clavesRespuestas: clavesRespuestas
            }
        });

        return NextResponse.json({ success: true, configActualizada });

    } catch (error) {
        console.error("Error al guardar solucionario:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}