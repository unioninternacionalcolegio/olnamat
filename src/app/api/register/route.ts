//app/api/register/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role, TipoColegio } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            dni,
            nombres,
            apellidos,
            email,
            celular,
            localidad,
            institucion,
            tipoColegio,
            role
        } = body

        if (!dni || !nombres || !apellidos || !role) {
            return NextResponse.json(
                { error: "Faltan datos obligatorios: dni, nombres, apellidos y role" },
                { status: 400 }
            )
        }

        const finalDni = dni.trim()

        const userExists = await prisma.user.findUnique({
            where: { dni: finalDni }
        })

        if (userExists) {
            return NextResponse.json(
                { error: "Este DNI ya está registrado" },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(finalDni, 10)
        // PLUS AÑADIDO: Nombres y Apellidos a Mayúsculas
        const fullName = `${nombres.trim()} ${apellidos.trim()}`.toUpperCase()
        
        // PLUS AÑADIDO: Institución a Mayúsculas
        const institucionMayus = institucion ? institucion.trim().toUpperCase() : null;

        const newUser = await prisma.user.create({
            data: {
                dni: finalDni,
                name: fullName,
                email: email || null,
                password: hashedPassword,
                celular: celular || null,
                localidad: localidad || null,
                institucion: institucionMayus, // Se guarda en mayúscula
                tipoColegio: (tipoColegio as TipoColegio) || TipoColegio.ESTATAL,
                role: role as Role,
            }
        })

        return NextResponse.json(
            {
                message: "Usuario creado con éxito",
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    dni: newUser.dni
                }
            },
            { status: 201 }
        )

    } catch (error) {
        console.error("Error en creacion de usuario:", error)
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        )
    }
}