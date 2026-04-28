"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { FileSpreadsheet, Upload, AlertCircle, Check } from "lucide-react"

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
            const sheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[sheetName]

            // Convertimos a JSON (arreglo de objetos)
            const jsonData = XLSX.utils.sheet_to_json(sheet)

            // MAPEAMOS LOS DATOS: Intentamos adivinar las columnas por su nombre
            const alumnosMapeados = jsonData.map((row: any) => ({
                dni: String(row.DNI || row.dni || row.DOCUMENTO || ""),
                nombres: row.NOMBRES || row.nombres || row.Nombre || "",
                apellidos: row.APELLIDOS || row.apellidos || row.Apellido || "",
                nivel: row.NIVEL || row.nivel || "PRIMARIA",
                gradoOEdad: row.GRADO || row.grado || row.EDAD || "1er Grado"
            }))

            onDataImported(alumnosMapeados)
            setLoading(false)
        }

        reader.readAsBinaryString(file)
    }

    return (
        <div className="relative">
            <label className="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-green-100 transition cursor-pointer border border-green-200">
                <FileSpreadsheet className="w-5 h-5" />
                <span>{loading ? "Procesando..." : "Importar desde Excel"}</span>
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileUpload}
                />
            </label>
        </div>
    )
}