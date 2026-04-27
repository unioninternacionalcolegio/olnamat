"use client"

import Image from "next/image"

export default function Carnet({ estudiante }: { estudiante: any }) {
    // Función para determinar dónde poner la X en el Nivel
    const getNivelMarker = (nivel: string) => {
        if (nivel === "INICIAL") return { left: "19.5%" } // Ajustar estos % según tu imagen
        if (nivel === "PRIMARIA") return { left: "23.5%" }
        if (nivel === "SECUNDARIA") return { left: "27.5%" }
        return { display: "none" }
    }

    // Función para determinar dónde poner la X en el Grado
    const getGradoMarker = (grado: string) => {
        // Asumimos que inicial 3 años marca el "1", 4 años el "2", etc. o según tu lógica
        const map: any = {
            "3 años": "43.5%", "4 años": "47.5%", "5 años": "51.5%",
            "1er Grado": "43.5%", "2do Grado": "47.5%", "3er Grado": "51.5%",
            "4to Grado": "55.5%", "5to Grado": "59.5%", "6to Grado": "63.5%"
        }
        return { left: map[grado] || "-10%" }
    }

    return (
        <div className="relative w-[10cm] h-[6.5cm] bg-white border border-dashed border-gray-300 rounded-xl overflow-hidden shrink-0 print:border-none print:shadow-none">
            {/* Imagen de fondo */}
            <Image
                src="/plantilla-carnet.png"
                alt="Plantilla Carnet"
                fill
                style={{ objectFit: 'contain' }}
                priority
            />

            {/* OVERLAYS DE TEXTO - Ajusta los % de 'top' y 'left' para que encajen perfecto en tus cajas */}

            {/* Turno */}
            <div className="absolute top-[21%] left-[60%] font-bold text-blue-900 text-[10px] uppercase">
                MAÑANA {/* O la variable que corresponda */}
            </div>

            {/* Apellidos */}
            <div className="absolute top-[43.5%] left-[28%] w-[40%] font-bold text-gray-900 text-xs truncate uppercase">
                {estudiante.apellidos}
            </div>

            {/* Nombres */}
            <div className="absolute top-[54.5%] left-[28%] w-[40%] font-bold text-gray-900 text-xs truncate uppercase">
                {estudiante.nombres}
            </div>

            {/* Institución Educativa */}
            <div className="absolute top-[65%] left-[28%] w-[40%] font-bold text-gray-900 text-[10px] uppercase leading-tight">
                {estudiante.institucion}
            </div>

            {/* Marcador de Nivel (X roja) */}
            <div
                className="absolute top-[80%] font-black text-red-600 text-lg"
                style={getNivelMarker(estudiante.nivel)}
            >
                X
            </div>

            {/* Marcador de Grado (X roja) */}
            <div
                className="absolute top-[80%] font-black text-red-600 text-lg"
                style={getGradoMarker(estudiante.gradoOEdad)}
            >
                X
            </div>
        </div>
    )
}