// src/components/ImportarExcel.tsx
"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { FileSpreadsheet, Download } from "lucide-react"

// --- TRADUCTOR INTELIGENTE NIVEL DIOS ---
const normalizarGrado = (gradoSucio: string, nivelLimpio: string) => {
    const g = String(gradoSucio).toLowerCase().trim()
    const matchNumero = g.match(/\d+/)
    const numero = matchNumero ? matchNumero[0] : null

    if (nivelLimpio === "INICIAL") {
        if (numero === "3" || g.includes("tres")) return "3 años"
        if (numero === "4" || g.includes("cuatro")) return "4 años"
        if (numero === "5" || g.includes("cinco")) return "5 años"
        return "5 años"
    }

    if (nivelLimpio === "PRIMARIA") {
        if (numero === "1" || g.includes("primer")) return "1er Grado"
        if (numero === "2" || g.includes("segund")) return "2do Grado"
        if (numero === "3" || g.includes("tercer")) return "3er Grado"
        if (numero === "4" || g.includes("cuart")) return "4to Grado"
        if (numero === "5" || g.includes("quint")) return "5to Grado"
        if (numero === "6" || g.includes("sext")) return "6to Grado"
        return "1er Grado"
    }

    if (nivelLimpio === "SECUNDARIA") {
        if (numero === "1" || g.includes("primer")) return "1er Año"
        if (numero === "2" || g.includes("segund")) return "2do Año"
        if (numero === "3" || g.includes("tercer")) return "3er Año"
        if (numero === "4" || g.includes("cuart")) return "4to Año"
        if (numero === "5" || g.includes("quint")) return "5to Año"
        return "1er Año"
    }

    return "1er Grado"
}

const normalizarNivel = (nivelSucio: string) => {
    const n = String(nivelSucio).toUpperCase().trim()
    if (n.includes("INI")) return "INICIAL"
    if (n.includes("SEC")) return "SECUNDARIA"
    return "PRIMARIA"
}

export default function ImportarExcel({ onDataImported }: { onDataImported: (alumnos: any[]) => void }) {
    const [loading, setLoading] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        const reader = new FileReader()

        reader.onload = async (event) => {
            try {
                const data = event.target?.result
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheet = workbook.Sheets[workbook.SheetNames[0]]
                const jsonData = XLSX.utils.sheet_to_json(sheet)

                // 1. Mapeo inicial (Traducción Nivel Dios)
                const alumnosMapeados = jsonData.map((row: any) => {
                    const nivelLimpio = normalizarNivel(row.NIVEL || row.nivel || row.Nivel || "")
                    const gradoLimpio = normalizarGrado(row.GRADO || row.grado || row.Grado || row.EDAD || "", nivelLimpio)
                    return {
                        dni: String(row.DNI || row.dni || row.DOCUMENTO || "").trim(),
                        nombres: String(row.NOMBRES || row.nombres || row.Nombre || "").trim().toUpperCase(),
                        apellidos: String(row.APELLIDOS || row.apellidos || row.Apellido || "").trim().toUpperCase(),
                        nivel: nivelLimpio,
                        gradoOEdad: gradoLimpio
                    }
                })

                // 2. 💉 MAGIA: Pasamos TODOS los alumnos tal cual salieron del mapeo.
                // Ya no omitimos nada aquí. El componente FormInscripcion se encargará
                // de buscar duplicados en la BD y pintar de rojo todo lo que esté mal.
                onDataImported(alumnosMapeados)

            } catch (error) {
                console.error(error)
                alert("Hubo un error al procesar el Excel.")
            } finally {
                setLoading(false)
                e.target.value = ''
            }
        }
        reader.readAsBinaryString(file)
    }

    return (
        <div className="flex flex-wrap gap-2">
            <a
                href="/plantilla_olnamat.xlsx"
                download="Plantilla_Inscripcion_Olnamat.xlsx"
                className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition border border-blue-200"
            >
                <Download className="w-5 h-5" />
                <span>Plantilla Excel</span>
            </a>

            <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition border ${loading ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer border-green-200'}`}>
                <FileSpreadsheet className="w-5 h-5" />
                <span>{loading ? "Procesando..." : "Importar Excel"}</span>
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={loading}
                />
            </label>
        </div>
    )
}