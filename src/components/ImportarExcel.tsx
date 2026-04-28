"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { FileSpreadsheet } from "lucide-react"

// --- TRADUCTOR INTELIGENTE DE GRADOS ---
const normalizarGrado = (gradoSucio: string, nivelLimpio: string) => {
    const g = String(gradoSucio).toLowerCase().trim()

    if (nivelLimpio === "INICIAL") {
        if (g.includes("3")) return "3 años"
        if (g.includes("4")) return "4 años"
        if (g.includes("5")) return "5 años"
        return "5 años" // Por defecto si no se entiende
    }

    if (nivelLimpio === "PRIMARIA") {
        if (g.includes("1")) return "1er Grado"
        if (g.includes("2")) return "2do Grado"
        if (g.includes("3")) return "3er Grado"
        if (g.includes("4")) return "4to Grado"
        if (g.includes("5")) return "5to Grado"
        if (g.includes("6")) return "6to Grado"
        return "1er Grado"
    }

    if (nivelLimpio === "SECUNDARIA") {
        if (g.includes("1")) return "1er Año"
        if (g.includes("2")) return "2do Año"
        if (g.includes("3")) return "3er Año"
        if (g.includes("4")) return "4to Año"
        if (g.includes("5")) return "5to Año"
        return "1er Año"
    }

    return "1er Grado" // Fallback de seguridad
}

// --- TRADUCTOR DE NIVELES ---
const normalizarNivel = (nivelSucio: string) => {
    const n = String(nivelSucio).toUpperCase().trim()
    if (n.includes("INI")) return "INICIAL"
    if (n.includes("SEC")) return "SECUNDARIA"
    return "PRIMARIA" // Si dice PRI o cualquier otra cosa rara, por defecto Primaria
}

export default function ImportarExcel({ onDataImported }: { onDataImported: (alumnos: any[]) => void }) {
    const [loading, setLoading] = useState(false)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        const reader = new FileReader()

        reader.onload = (event) => {
            const data = event.target?.result
            const workbook = XLSX.read(data, { type: 'binary' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(sheet)

            const alumnosMapeados = jsonData.map((row: any) => {
                // 1. Limpiamos Nivel
                const nivelLimpio = normalizarNivel(row.NIVEL || row.nivel || "")
                // 2. Limpiamos Grado usando el Nivel como contexto
                const gradoLimpio = normalizarGrado(row.GRADO || row.grado || row.EDAD || "", nivelLimpio)

                return {
                    dni: String(row.DNI || row.dni || row.DOCUMENTO || "").trim(),
                    nombres: String(row.NOMBRES || row.nombres || row.Nombre || "").trim().toUpperCase(),
                    apellidos: String(row.APELLIDOS || row.apellidos || row.Apellido || "").trim().toUpperCase(),
                    nivel: nivelLimpio,
                    gradoOEdad: gradoLimpio
                }
            })

            onDataImported(alumnosMapeados)
            setLoading(false)
            e.target.value = ''
        }

        reader.readAsBinaryString(file)
    }

    return (
        // ... (el return con el botón de ImportarExcel queda exactamente igual) ...
        <label className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-green-100 transition cursor-pointer border border-green-200">
            <FileSpreadsheet className="w-5 h-5" />
            <span>{loading ? "Procesando..." : "Importar Excel"}</span>
            <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileUpload}
            />
        </label>
    )
}