// components/CarnetDelegadoHorizontal.tsx
"use client"
import { useEffect } from "react";
import Image from "next/image";

interface Props {
    nombreDelegado: string;
    nombreInstitucion: string;
}

export default function CarnetDelegadoHorizontal({ nombreDelegado, nombreInstitucion }: Props) {

    useEffect(() => {
        // Lanzar impresión automáticamente después de un pequeño delay para asegurar carga de estilos e imágenes
        const timer = setTimeout(() => {
            window.print();
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <div className="print-area flex justify-center items-center min-h-screen bg-gray-100 p-4 media-screen-only">
                {/* Contenedor del Carnet - Simula tamaño tarjeta CR80 horizontal */}
                <div className="carnet-horizontal bg-white shadow-2xl rounded-xl overflow-hidden relative border border-gray-200">

                    {/* Encabezado Azul Rearreglado */}
                    <div className="absolute top-0 left-0 w-full h-[35%] bg-blue-700 rounded-b-[2rem] flex items-center justify-between px-6 z-10">
                        <div className="flex items-center gap-3">
                            {/* Logo Colegio Unión - Asumimos que tienes la imagen separada */}
                            <Image src="/logo_union_solo.png" alt="Logo Unión" width={120} height={40} className="object-contain" />
                        </div>
                        {/* Logo SLNAMAT 2026 - Rearreglado a la derecha */}
                        <div className="bg-white p-1 rounded-full border-2 border-blue-800">
                            <Image src="/logo_slnamat_circulo.png" alt="SLNAMAT 2026" width={60} height={60} className="object-contain" />
                        </div>
                    </div>

                    {/* Cuerpo del Carnet */}
                    <div className="absolute top-[38%] left-0 w-full h-[45%] px-6 py-2 z-10 flex flex-col justify-center">
                        <div className="flex justify-between items-baseline mb-2">
                            <h1 className="text-3xl font-black text-blue-900 tracking-tighter">DELEGADO</h1>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b-2 border-blue-200 pb-1">Invitado</p>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-gray-100">
                            <p className="text-sm text-gray-800 font-extrabold uppercase">
                                {nombreDelegado}
                            </p>
                            <p className="text-[11px] text-gray-600 font-medium">
                                <strong className="text-gray-900">Colegio:</strong> {nombreInstitucion}
                            </p>
                        </div>
                    </div>

                    {/* Patrón Decorativo Inferior Rearreglado */}
                    <div className="absolute bottom-0 left-0 w-full h-[15%] bg-blue-50 flex items-center px-6 z-10 border-t border-blue-100">
                        <div className="flex gap-1 h-full items-center">
                            <div className="w-6 h-6 bg-blue-200 rounded-lg"></div>
                            <div className="w-8 h-8 bg-blue-600 rounded-t-full"></div>
                            <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                            <div className="w-10 h-6 bg-blue-800 rounded-r-lg"></div>
                        </div>
                        <p className="ml-auto text-[9px] font-bold text-blue-800/50">SLNAMAT 2026</p>
                    </div>

                    {/* Marca de agua sutil de fondo */}
                    <div className="absolute inset-0 opacity-[0.03] z-0 flex justify-center items-center">
                        <Image src="/logo_slnamat_circulo.png" alt="watermark" width={300} height={300} className="object-contain rotate-[-15deg]" />
                    </div>

                </div>
            </div>

            {/* --- ESTILOS CSS INYECTADOS DE FORMA SEGURA PARA EVITAR HYDRATION MISMATCH --- */}
            <style dangerouslySetInnerHTML={{
                __html: `
          /* Estándar ISO tarjeta de crédito: 85.6mm x 53.98mm */
          .carnet-horizontal {
            width: 85.6mm;
            height: 53.98mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @media screen {
            .media-screen-only {
              display: flex;
            }
          }

          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: white;
              padding: 0;
              margin: 0;
            }
            .carnet-horizontal {
              box-shadow: none;
              border: none;
              margin: 0;
            }
            @page {
              size: landscape;
              margin: 0;
            }
            .media-screen-only {
              display: none !important;
            }
          }
        `
            }} />
        </>
    );
}