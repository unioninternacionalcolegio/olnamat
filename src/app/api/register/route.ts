//app/api/register/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role, TipoColegio } from "@prisma/client" // Importamos el Enum

export async function POST(req: Request) {
    try {
        const body = await req.json()
        // 1. Agregamos tipoColegio a la desestructuración
        const {
            dni,
            nombres,
            apellidos,
            email,
            celular,
            localidad,
            institucion,
            tipoColegio, // <-- Nuevo campo del formulario de registro
            role
        } = body

        // Validación básica
        if (!dni || !nombres || !apellidos || !role) {
            return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
        }

        // Verificar que el DNI no esté registrado
        const userExists = await prisma.user.findUnique({
            where: { dni }
        })

        if (userExists) {
            return NextResponse.json({ error: "Este DNI ya está registrado en el sistema" }, { status: 400 })
        }

        // La contraseña por defecto será el mismo DNI
        const hashedPassword = await bcrypt.hash(dni, 10)

        // Juntar nombres y apellidos para el campo 'name'
        const fullName = `${nombres} ${apellidos}`

        // 2. Creamos el usuario con el nuevo campo
        const newUser = await prisma.user.create({
            data: {
                dni,
                name: fullName.toUpperCase(), // Lo guardamos en mayúsculas para ser prolijos
                email: email || null,
                password: hashedPassword,
                celular: celular || null,
                localidad: localidad || null,
                institucion: institucion || null,

                // IMPORTANTE: Guardamos el tipo de colegio
                // Si el frontend no lo manda, podemos forzar un default o usar el enum
                tipoColegio: (tipoColegio as TipoColegio) || TipoColegio.ESTATAL,

                role: role as Role,
            }
        })

        return NextResponse.json({
            message: "Usuario creado con éxito",
            user: { id: newUser.id, name: newUser.name }
        }, { status: 201 })

    } catch (error) {
        console.error("Error en registro:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}