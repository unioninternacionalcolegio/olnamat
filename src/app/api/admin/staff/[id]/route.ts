import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

// CORRECCIÓN: Hacemos que params sea una Promesa en el tipado
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { dni, name, role, resetPassword } = await req.json();
        
        // CORRECCIÓN: Extraemos el id resolviendo la promesa
        const { id } = await params;
        
        let updateData: any = {
            dni,
            name: name.toUpperCase().trim(),
            role: role as Role
        };

        if (resetPassword) {
            updateData.password = await bcrypt.hash(dni, 10);
        }

        const updated = await prisma.user.update({
            where: { id: id }, // <-- Ahora sí 'id' tiene un valor real
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al actualizar el usuario" }, { status: 500 });
    }
}

// CORRECCIÓN: Hacemos que params sea una Promesa en el tipado
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // CORRECCIÓN: Extraemos el id resolviendo la promesa
        const { id } = await params;

        await prisma.user.delete({ where: { id: id } }); // <-- Ahora sí 'id' tiene un valor real
        
        return NextResponse.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error al eliminar el usuario" }, { status: 500 });
    }
}