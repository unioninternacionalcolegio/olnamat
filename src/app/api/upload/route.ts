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

        // Le ponemos un nombre único para que no se sobreescriban (Ej: voucher_167890_foto.jpg)
        const fileName = `voucher_${Date.now()}_${file.name.replace(/\s/g, '_')}`

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