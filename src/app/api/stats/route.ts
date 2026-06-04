// app/api/stats/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Evita que Next.js cachee este resultado

export async function GET() {
    try {
        // 1. Contamos cuántos pagos tienen el estado PENDIENTE
        const pagosPendientes = await prisma.pago.count({
            where: { estado: "PENDIENTE" }
        });

        // 2. Contamos cuántos estudiantes ya tienen un resultado subido
        const notasSubidas = await prisma.resultadoExamen.count();

        return NextResponse.json({ pagosPendientes, notasSubidas });
    } catch (error) {
        console.error("Error obteniendo stats:", error);
        return NextResponse.json({ pagosPendientes: 0, notasSubidas: 0 }, { status: 500 });
    }
}