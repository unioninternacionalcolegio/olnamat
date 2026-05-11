// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role, TipoColegio } from "@prisma/client" // Ajusta esto si tus Enums se llaman diferente en schema.prisma

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

        // 1. Validaciones básicas
        if (!dni || !nombres || !apellidos || !localidad || !role) {
            return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 })
        }

        if (dni.length < 8) {
            return NextResponse.json({ error: "El DNI debe tener al menos 8 caracteres." }, { status: 400 })
        }

        // 2. Verificar si el DNI ya está registrado
        const usuarioExistente = await prisma.user.findUnique({
            where: { dni: dni }
        })

        if (usuarioExistente) {
            return NextResponse.json({ error: "Este DNI ya se encuentra registrado." }, { status: 400 })
        }

        // 3. Encriptar la contraseña (El frontend indica que la contraseña es el DNI)
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(dni, salt)

        // 4. Crear el usuario en la base de datos
        const nuevoUsuario = await prisma.user.create({
            data: {
                dni: dni,
                // Si en tu modelo usas un solo campo "name" para nombre completo:
                name: `${nombres.trim()} ${apellidos.trim()}`.toUpperCase(),
                // Si en tu modelo tienes los campos separados, descomenta las siguientes líneas:
                // nombres: nombres.trim().toUpperCase(),
                // apellidos: apellidos.trim().toUpperCase(),

                email: email ? email.toLowerCase() : null,
                celular: celular || null,
                localidad: localidad.trim().toUpperCase(),
                institucion: institucion.trim().toUpperCase(),
                tipoColegio: tipoColegio as TipoColegio,
                role: role as Role,
                password: hashedPassword, // Guardamos la contraseña encriptada
            }
        })

        // 5. Quitamos la contraseña de la respuesta por seguridad
        const { password, ...usuarioSinPassword } = nuevoUsuario

        // 6. Respondemos con éxito
        return NextResponse.json({
            message: "Usuario registrado con éxito",
            user: usuarioSinPassword
        }, { status: 201 })

    } catch (error: any) {
        console.error("Error en registro de usuario:", error)

        // Manejo de errores específicos de Prisma (ej. si el DNI ya existe y falló el findUnique)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Este DNI ya se encuentra registrado." }, { status: 400 })
        }

        return NextResponse.json({ error: "Error interno del servidor al registrar." }, { status: 500 })
    }
}