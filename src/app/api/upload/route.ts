import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Nos conectamos a Supabase Storage
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: "No se subió ningún archivo" }, { status: 400 })
        }

        // Convertimos el archivo para poder subirlo
        const buffer = Buffer.from(await file.arrayBuffer())

        // MAGIA QUIRÚRGICA: Limpiamos el nombre del archivo.
        // 1. normalize("NFD") y el replace quitan las tildes (á -> a) y las ñ (ñ -> n)
        // 2. El segundo replace cambia cualquier cosa que NO sea letra o número por un guión bajo
        const safeFileName = file.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9.-]/g, "_")

        // Le ponemos un nombre único y limpio (Ej: voucher_167890_3anosolnamat.png)
        const fileName = `voucher_${Date.now()}_${safeFileName}`

        // Subimos la imagen al bucket 'vouchers'
        const { data, error } = await supabase.storage
            .from('vouchers')
            .upload(fileName, buffer, {
                contentType: file.type,
            })

        if (error) throw error

        // Obtenemos la URL pública de la imagen
        const { data: publicUrlData } = supabase.storage.from('vouchers').getPublicUrl(fileName)

        // Devolvemos el link real
        return NextResponse.json({ url: publicUrlData.publicUrl })

    } catch (error) {
        console.error("Error al subir imagen:", error)
        return NextResponse.json({ error: "Error al guardar el voucher" }, { status: 500 })
    }
}