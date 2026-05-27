//src/components/Carnet.tsx
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
        const map: any = {
            "3 años": "51.5%", "4 años": "55.5%", "5 años": "59.5%",
            "1er Grado": "43%", "2do Grado": "47%", "3er Grado": "51.5%",
            "4to Grado": "55.5%", "5to Grado": "59.5%", "6to Grado": "65.5%",
            "1er Año": "43%", "2do Año": "47%", "3er Año": "51.5%",
            "4to Año": "55.5%", "5to Año": "59.5%"
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

            {/* OVERLAYS DE TEXTO */}

            {/* CÓDIGO DEL ESTUDIANTE (DNI) - Arriba a la derecha tipo H2 */}
            <div className="absolute top-[8%] right-[5%] font-black text-gray-900 text-xl tracking-widest bg-white/50 px-2 rounded backdrop-blur-sm">
                CÓD: {estudiante.dni || estudiante.id.substring(0, 8)}
            </div>

            {/* Turno y Hora de Inicio */}
            <div className="absolute top-[18%] left-[67.8%] font-bold text-blue-900 text-[12px] uppercase">
                {estudiante.turno || "TURNO 1"} {estudiante.horaInicio ? `${estudiante.horaInicio}` : ""}
            </div>

            {/* Apellidos */}
            <div className="absolute top-[43%] left-[29%] w-[50%] font-bold text-gray-900 text-xs truncate uppercase">
                {estudiante.apellidos}
            </div>

            {/* Nombres */}
            <div className="absolute top-[54%] left-[29%] w-[50%] font-bold text-gray-900 text-xs truncate uppercase">
                {estudiante.nombres}
            </div>

            {/* Institución Educativa */}
            <div className="absolute top-[64%] left-[29%] w-[50%] font-bold text-gray-900 text-[10px] uppercase leading-tight">
                {estudiante.institucion}
            </div>

            {/* Marcador de Nivel (X roja) */}
            <div
                className="absolute top-[76.4%] font-black text-red-600 text-lg"
                style={getNivelMarker(estudiante.nivel)}
            >
                X
            </div>

            {/* Marcador de Grado (X roja) */}
            <div
                className="absolute top-[76.4%] font-black text-red-600 text-lg"
                style={getGradoMarker(estudiante.gradoOEdad)}
            >
                X
            </div>
        </div>
    )
}