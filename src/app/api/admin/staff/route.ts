import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function GET() {
    try {
        const staff = await prisma.user.findMany({
            where: {
                role: { in: [Role.ASISTENTE, Role.REVISADOR] }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(staff);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener personal" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { dni, name, role } = await req.json();

        if (!dni || !name || !role) {
            return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
        }

        const existe = await prisma.user.findUnique({ where: { dni } });
        if (existe) {
            return NextResponse.json({ error: "Este DNI ya está registrado en el sistema" }, { status: 400 });
        }

        // El DNI se convierte en la contraseña por defecto
        const hashedPassword = await bcrypt.hash(dni, 10);

        const newStaff = await prisma.user.create({
            data: {
                dni,
                name: name.toUpperCase().trim(),
                password: hashedPassword,
                role: role as Role,
            }
        });

        return NextResponse.json(newStaff, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Error interno al crear usuario" }, { status: 500 });
    }
}