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
    // Lanzar impresión automáticamente después de un pequeño delay
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

          {/* ========================================================================= */}
          {/* 1. IMAGEN DE FONDO PRINCIPAL                                             */}
          {/* Coloca tu archivo en la carpeta /public (ej. public/fondo-carnet.jpg)     */}
          {/* ========================================================================= */}
          <Image
            src="/f-delegado.png"
            alt="Fondo del Carnet"
            fill
            priority
            className="object-cover z-0"
          />

          {/* Encabezado Azul (z-20 para estar al frente) */}
          <div className="absolute top-0 left-0 w-full h-[15%] bg-blue-700 rounded-b-[2rem] flex items-center justify-between px-8 z-20">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo Unión" width={80} height={40} className="object-contain" />
            </div>
            <div className="bg-blue p-1 rounded-full border-2 border-blue-800">
              <Image src="/colegios/union-internacional.png" alt="SLNAMAT 2026" width={60} height={60} className="object-contain" />
            </div>
          </div>

          {/* Cuerpo del Carnet */}
          <div className="absolute top-[46%] left-0 w-full h-[45%] pl-0 pr-6 py-2 z-20 flex flex-col justify-center">
            <div className="flex justify-between items-baseline mb-0 pl-6">
              <h1 className="text-3xl font-black text-blue-900 tracking-tighter">DELEGADO</h1>
              <div className="absolute top-14 right-4 bg-gray-500 text-white px-4 py-1 rounded-lg transform -rotate-8">
                <span className="font-bold text-white tracking-widest text-xs uppercase">Invitado</span>
              </div>
            </div>

            <div className="space-y-0 pt-8 border-t border-gray-100 pl-2">
              <p className="text-[11px] text-gray-800 font-extrabold uppercase">
                {nombreDelegado}
              </p>
              <p className="text-[12px] text-gray-600 font-medium">
                <strong className="text-gray-900">Colegio:</strong> {nombreInstitucion}
              </p>
            </div>
          </div>

          {/* Patrón Decorativo Inferior (z-20 para estar al frente) */}
          <div className="absolute bottom-0 left-0 w-full h-[15%] bg-blue-50/90 flex items-center px-6 z-20 border-t border-blue-100 backdrop-blur-sm">
            <div className="flex gap-1 h-full items-center">
              <div className="w-6 h-6 bg-blue-200 rounded-lg"></div>
              <div className="w-8 h-8 bg-blue-600 rounded-t-full"></div>
              <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
              <div className="w-10 h-6 bg-blue-800 rounded-r-lg"></div>
            </div>
            <p className="ml-auto text-[9px] font-bold text-blue-800/50">OLNAMAT 2026</p>
          </div>

          {/* Marca de agua sutil de fondo (z-10 para estar sobre el fondo pero bajo el texto) */}
          <div className="absolute inset-0 opacity-[0.04] z-10 flex justify-center items-center pointer-events-none">
            <Image src="/logo_slnamat_circulo.png" alt="watermark" width={300} height={300} className="object-contain rotate-[-15deg]" />
          </div>

        </div>
      </div>

      {/* --- ESTILOS CSS INYECTADOS --- */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Estándar ISO tarjeta de crédito: 85.6mm x 53.98mm */
          .carnet-horizontal {
            width: 60.6mm;
            height: 90mm;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @media screen {
            .media-screen-only {
              display: flex;
            }
          }

          @media print {
  /* Oculta absolutamente todo el cuerpo de la página */
  body {
    visibility: hidden;
    background: transparent;
  }
  /* Muestra ÚNICAMENTE el contenedor del carnet y su contenido */
  .print-area {
    visibility: visible;
    position: fixed; /* Forzar a que se posicione al inicio de la página de impresión */
    left: 0;
    top: 0;
    width: 85.6mm;  /* Ajusta al tamaño exacto de tu carnet */
    height: 53.98mm;
    margin: 0;
    padding: 0;
  }
  .print-area * {
    visibility: visible;
  }
  .carnet-horizontal {
    box-shadow: none;
    border: none;
  }
  @page {
    size: landscape;
    margin: 0;
  }
}
        `
      }} />
    </>
  );
}