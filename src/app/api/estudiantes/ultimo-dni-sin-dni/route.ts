import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        // Buscamos estudiantes cuyos DNIs empiecen con "0000" para aislar los autogenerados
        const estudiantes = await prisma.estudiante.findMany({
            where: {
                dni: { startsWith: '0000' }
            },
            select: { dni: true }
        })

        let maxNum = 0;
        for (const est of estudiantes) {
            // Validamos que el DNI sea numérico puro para evitar errores
            if (est.dni && /^0{4,}\d+$/.test(est.dni)) {
                const num = parseInt(est.dni, 10);
                if (num > maxNum) maxNum = num;
            }
        }

        const nextNum = maxNum + 1;
        const nextDni = nextNum.toString().padStart(8, '0');

        return NextResponse.json({ nextDni, nextNum })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Error al obtener DNI" }, { status: 500 })
    }
}