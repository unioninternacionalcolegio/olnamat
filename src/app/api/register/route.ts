import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role, TipoColegio } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            dni, nombres, apellidos, email, celular, localidad,
            institucion, tipoColegio, role
        } = body

        if (!nombres || !apellidos || !role) {
            return NextResponse.json({ error: "Faltan datos obligatorios (Nombres, Apellidos o Rol)" }, { status: 400 })
        }

        // AUTO-GENERAR DNI SI VIENE VACÍO
        let finalDni = dni?.trim()
        if (!finalDni) {
            finalDni = `LIB-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`
        }

        const userExists = await prisma.user.findUnique({ where: { dni: finalDni } })
        if (userExists) {
            return NextResponse.json({ error: "Este DNI/Código ya está registrado" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(finalDni, 10)
        const fullName = `${nombres} ${apellidos}`

        const newUser = await prisma.user.create({
            data: {
                dni: finalDni,
                name: fullName.toUpperCase(),
                email: email || null,
                password: hashedPassword,
                celular: celular || null,
                localidad: localidad || null,
                institucion: institucion || null,
                tipoColegio: (tipoColegio as TipoColegio) || TipoColegio.ESTATAL,
                role: role as Role,
            }
        })

        return NextResponse.json({
            message: "Usuario creado con éxito",
            // IMPORTANTE: Devolvemos el DNI (generado o no) para que la Caja POS lo pueda usar
            user: { id: newUser.id, name: newUser.name, dni: newUser.dni }
        }, { status: 201 })

    } catch (error) {
        console.error("Error en creacion de usuario:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}