import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { dni, nombres, apellidos, email, celular, localidad, institucion, role } = body

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

        // Crear el usuario
        const newUser = await prisma.user.create({
            data: {
                dni,
                name: fullName,
                email: email || null, // Opcional
                password: hashedPassword,
                celular: celular || null,
                localidad: localidad || null,
                institucion: institucion || null,
                role: role as Role, // Debe ser LIBRE o DELEGADO
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