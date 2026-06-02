import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, institucion, descuento } = body;

        const instLimpia = institucion.toUpperCase().trim();

        if (id) {
            // Actualizar existente
            const actualizado = await prisma.descuentoColegio.update({
                where: { id },
                data: { institucion: instLimpia, descuento: Number(descuento) }
            });
            return NextResponse.json({ descuento: actualizado });
        } else {
            // Verificar si el colegio ya tiene un descuento para evitar duplicados
            const existe = await prisma.descuentoColegio.findUnique({
                where: { institucion: instLimpia }
            });

            if (existe) {
                return NextResponse.json({ error: "Este colegio ya tiene un descuento configurado." }, { status: 400 });
            }

            // Crear nuevo
            const nuevo = await prisma.descuentoColegio.create({
                data: { institucion: instLimpia, descuento: Number(descuento) }
            });
            return NextResponse.json({ descuento: nuevo });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}