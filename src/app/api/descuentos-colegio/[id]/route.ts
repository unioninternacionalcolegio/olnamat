import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Fíjate que ahora params es Promise<{ id: string }>
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Await a los parámetros antes de usarlos
        const resolvedParams = await params;
        const id = resolvedParams.id;

        await prisma.descuentoColegio.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}