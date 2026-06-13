// app/(dashboard)/admin/resultados/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { Trophy, Search, Clock, Medal, Download, CheckSquare, Square, Eye, X, CheckCircle2, XCircle, MinusCircle } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const OPCIONES_GRADOS = {
    INICIAL: ["3 años", "4 años", "5 años"],
    PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    SECUNDARIA: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
}

// NUEVO: Extrae la hora exacta y literal de la BD sin que el navegador la altere
const formatearHoraExactaDB = (fechaIso: string | Date | null) => {
    if (!fechaIso) return "--:--:--";
    const d = new Date(fechaIso);
    // Usamos métodos UTC para leer los números tal cual se guardaron en la DB
    const hh = d.getUTCHours().toString().padStart(2, '0');
    const mm = d.getUTCMinutes().toString().padStart(2, '0');
    const ss = d.getUTCSeconds().toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
};

export default function ResultadosAdminPage() {
    const [nivel, setNivel] = useState<keyof typeof OPCIONES_GRADOS>("PRIMARIA")
    const [grado, setGrado] = useState("1er Grado")

    // Data cruda de la API
    const [dataCruda, setDataCruda] = useState<any[]>([])
    const [clavesPlantilla, setClavesPlantilla] = useState<any>({})
    const [loading, setLoading] = useState(false)

    // Sistema de Filtros Inteligente
    const [colegiosUnicos, setColegiosUnicos] = useState<string[]>([])
    const [colegiosSeleccionados, setColegiosSeleccionados] = useState<string[]>([])

    // Modal de Respuestas
    const [modalAbierto, setModalAbierto] = useState(false)
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null)

    useEffect(() => {
        setGrado(OPCIONES_GRADOS[nivel][0])
    }, [nivel])

    const fetchResultados = async () => {
        setLoading(true)
        setDataCruda([])
        setColegiosUnicos([])
        setColegiosSeleccionados([])
        try {
            const res = await fetch(`/api/resultados?nivel=${nivel}&grado=${grado}`)
            const data = await res.json()
            if (res.ok) {
                // MAGIA: Inyectamos un resultado vacío para los que no rindieron
                const estudiantesNormalizados = data.estudiantes.map((e: any) => ({
                    ...e,
                    resultado: e.resultado || {
                        correctas: 0,
                        incorrectas: 0,
                        enBlanco: 0,
                        puntajeTotal: 0,
                        horaSalida: null,
                        respuestasDetalle: null,
                        esFalta: true // Flag para saber que no dio examen
                    }
                }))

                setDataCruda(estudiantesNormalizados)
                setClavesPlantilla(data.clavesRespuestas)

                // Limpiamos el "LIBRE-" para agrupar colegios únicos en los checkboxes
                const insts = Array.from(new Set(estudiantesNormalizados.map((e: any) => {
                    return e.institucion.startsWith("LIBRE-")
                        ? e.institucion.substring(6).trim()
                        : e.institucion.trim();
                }))) as string[]

                setColegiosUnicos(insts.sort())
                setColegiosSeleccionados(insts) // Por defecto todos seleccionados
            } else {
                alert(data.error)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const toggleColegio = (col: string) => {
        if (colegiosSeleccionados.includes(col)) {
            setColegiosSeleccionados(prev => prev.filter(c => c !== col))
        } else {
            setColegiosSeleccionados(prev => [...prev, col])
        }
    }

    const seleccionarTodos = () => setColegiosSeleccionados(colegiosUnicos)
    const deseleccionarTodos = () => setColegiosSeleccionados([])

    // ========================================================
    // MAGIA: Recálculo en Vivo del Ranking según los Checks
    // ========================================================
    const rankingFiltrado = useMemo(() => {
        // 1. Filtrar los colegios que coincidan (limpiando "LIBRE-" si lo tienen)
        const filtrados = dataCruda.filter(est => {
            const nombreBase = est.institucion.startsWith("LIBRE-")
                ? est.institucion.substring(6).trim()
                : est.institucion.trim();
            return colegiosSeleccionados.includes(nombreBase);
        });

        // 2. Ordenar priorizando la asistencia, luego Puntaje (Descendente) y Tiempo (Ascendente)
        const ordenados = filtrados.sort((a, b) => {
            const faltaA = a.resultado.esFalta;
            const faltaB = b.resultado.esFalta;

            // 🛑 ULTRA MAGIA: Si uno faltó y el otro no, el que FALTÓ se va al final absoluto (después de los negativos)
            if (faltaA && !faltaB) return 1;
            if (!faltaA && faltaB) return -1;

            // Si ambos asistieron (o ambos faltaron), comparamos por puntaje total de forma descendente
            if (b.resultado.puntajeTotal !== a.resultado.puntajeTotal) {
                return b.resultado.puntajeTotal - a.resultado.puntajeTotal; // Mayor puntaje primero
            }

            // Desempate por hora (El que entregó antes gana)
            const tiempoA = a.resultado.horaSalida ? new Date(a.resultado.horaSalida).getTime() : Infinity;
            const tiempoB = b.resultado.horaSalida ? new Date(b.resultado.horaSalida).getTime() : Infinity;

            if (tiempoA === Infinity && tiempoB === Infinity) return 0;

            return tiempoA - tiempoB;
        });

        // 3. Asignar el nuevo puesto en vivo
        return ordenados.map((est, index) => ({
            ...est,
            puesto: index + 1
        }));
    }, [dataCruda, colegiosSeleccionados]);


    // ========================================================
    // GENERACIÓN DE PDF (PULIDO Y LISTO PARA PUBLICAR)
    // ========================================================
    const descargarPDF = () => {
        if (rankingFiltrado.length === 0) return alert("No hay datos para exportar.");

        const doc = new jsPDF("p", "pt", "a4");

        // 1. Títulos Centrales
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("RESULTADOS OFICIALES", doc.internal.pageSize.getWidth() / 2, 50, { align: "center" });

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`${nivel} - ${grado}`, doc.internal.pageSize.getWidth() / 2, 70, { align: "center" });


        // 2. Insertar Logos (Requiere las imágenes en public/)
        try {
            const imgLeft = new Image();
            imgLeft.src = '/logo.png';
            doc.addImage(imgLeft, 'PNG', 40, 30, 100, 60);

            const imgRight = new Image();
            imgRight.src = '/colegios/union-internacional.png';
            doc.addImage(imgRight, 'PNG', doc.internal.pageSize.getWidth() - 130, 30, 100, 60);
        } catch (e) {
            console.log("No se encontraron los logos, continuando sin ellos.");
        }

        // 3. Tabla de Resultados
        const columnas = ["PUESTO", "ESTUDIANTE", "INSTITUCIÓN", "CORR.", "INCO.", "BLANCO", "HORA EXACTA", "PUNTAJE"];

        const filas = rankingFiltrado.map(est => {
            // ---> LIMPIEZA DE NOMBRES Y APELLIDOS (Adiós tabulaciones y saltos de línea invisibles) <---
            const apellidosLimpio = est.apellidos ? est.apellidos.replace(/\s+/g, ' ').trim() : "";
            const nombresLimpio = est.nombres ? est.nombres.replace(/\s+/g, ' ').trim() : "";
            const nombreCompletoFormateado = `${apellidosLimpio}, ${nombresLimpio}`.toUpperCase();

            // ---> LÓGICA PARA EL NOMBRE DEL COLEGIO (Agregando "LIBRE - " de forma bonita) <---
            let institucionLimpia = est.institucion ? est.institucion.replace(/\s+/g, ' ').trim().toUpperCase() : "";

            // CORRECCIÓN: Estaba institucionLinter, ahora está correctamente institucionLimpia
            if (institucionLimpia.startsWith("LIBRE-")) {
                const soloNombreColegio = institucionLimpia.substring(6).trim();
                institucionLimpia = `LIBRE - ${soloNombreColegio}`;
            } else if (est.tipoColegio === 'LIBRE') {
                institucionLimpia = `LIBRE - ${institucionLimpia}`;
            }

            return [
                `${est.puesto}°`,
                nombreCompletoFormateado,
                institucionLimpia,
                est.resultado.correctas,
                est.resultado.incorrectas,
                est.resultado.enBlanco,
                est.resultado.esFalta ? "NO PRESENTADO" : formatearHoraExactaDB(est.resultado.horaSalida),
                est.resultado.puntajeTotal.toString()
            ]
        });

        autoTable(doc, {
            head: [columnas],
            body: filas,
            startY: 110,
            styles: { fontSize: 8, cellPadding: 4 },
            headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center' },
            columnStyles: {
                0: { halign: 'center', fontStyle: 'bold' },
                3: { halign: 'center', textColor: [22, 163, 74] }, // Verde
                4: { halign: 'center', textColor: [220, 38, 38] }, // Rojo
                5: { halign: 'center', textColor: [156, 163, 175] }, // Gris
                6: { halign: 'center' },
                7: { halign: 'center', fontStyle: 'bold', fontSize: 10 }
            },
            alternateRowStyles: { fillColor: [249, 250, 251] },
        });

        // 4. Guardar archivo
        doc.save(`Ranking_${nivel}_${grado.replace(/\s+/g, "_")}.pdf`);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center">
                        <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                        Resultados y Ranking en Vivo
                    </h1>
                    <p className="text-gray-500 mt-1">Genera rankings dinámicos y descárgalos en PDF.</p>
                </div>
                {rankingFiltrado.length > 0 && (
                    <button onClick={descargarPDF} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center transition-colors shadow-lg shadow-red-600/20">
                        <Download className="w-5 h-5 mr-2" /> Exportar PDF
                    </button>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nivel</label>
                    <select value={nivel} onChange={(e) => setNivel(e.target.value as any)} className="w-full p-3 border rounded-xl bg-gray-50 font-bold text-blue-700">
                        <option value="INICIAL">INICIAL</option>
                        <option value="PRIMARIA">PRIMARIA</option>
                        <option value="SECUNDARIA">SECUNDARIA</option>
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Grado o Edad</label>
                    <select value={grado} onChange={(e) => setGrado(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 font-bold text-gray-700">
                        {OPCIONES_GRADOS[nivel].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <button
                    onClick={fetchResultados}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-xl font-bold flex items-center transition-colors h-[50px] w-full md:w-auto justify-center"
                >
                    {loading ? <Clock className="w-5 h-5 mr-2 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                    Cargar Data
                </button>
            </div>

            {dataCruda.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-blue-900 text-lg">Filtro de Ranking en Vivo</h3>
                        <div className="space-x-3">
                            <button onClick={seleccionarTodos} className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Marcar Todos</button>
                            <button onClick={deseleccionarTodos} className="text-xs font-bold bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50">Desmarcar Todos</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {colegiosUnicos.map(col => {
                            const activo = colegiosSeleccionados.includes(col);
                            return (
                                <button
                                    key={col}
                                    onClick={() => toggleColegio(col)}
                                    className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activo ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-blue-200 text-gray-500 hover:border-blue-400'}`}
                                >
                                    {activo ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
                                    {col}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500 font-bold animate-pulse">Consultando base de datos...</div>
            ) : rankingFiltrado.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
                        <span className="font-bold">Ranking Calculado</span>
                        <span className="text-xs font-black bg-blue-500 px-3 py-1 rounded-full">{rankingFiltrado.length} Participantes en el Filtro</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-center">Puesto</th>
                                    <th className="px-6 py-4">Estudiante</th>
                                    <th className="px-6 py-4">Institución</th>
                                    <th className="px-6 py-4 text-center text-green-600">Corr</th>
                                    <th className="px-6 py-4 text-center text-red-600">Inco</th>
                                    <th className="px-6 py-4 text-center text-gray-500">Blan</th>
                                    <th className="px-6 py-4 text-center">Hora Exacta</th>
                                    <th className="px-6 py-4 text-center text-blue-600">Puntaje</th>
                                    <th className="px-6 py-4 text-center text-purple-600">Ficha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rankingFiltrado.map((est) => {
                                    // Verificamos si empieza con "LIBRE-" para setear el badge y nombre
                                    const esLibreDirecto = est.institucion.startsWith("LIBRE-");
                                    const nombreInstitucionFinal = esLibreDirecto ? est.institucion.substring(6).trim() : est.institucion;
                                    const tipoColegioFinal = esLibreDirecto ? "LIBRE" : est.tipoColegio;

                                    return (
                                        <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-center font-black text-lg">
                                                {est.puesto === 1 ? <Medal className="w-6 h-6 text-yellow-500 mx-auto drop-shadow" /> :
                                                    est.puesto === 2 ? <Medal className="w-6 h-6 text-gray-400 mx-auto drop-shadow" /> :
                                                        est.puesto === 3 ? <Medal className="w-6 h-6 text-amber-600 mx-auto drop-shadow" /> :
                                                            <span className="text-gray-500">{est.puesto}°</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{est.apellidos}, {est.nombres}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-0.5">{est.dni || 'S/DNI'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800 text-[11px] leading-tight">{nombreInstitucionFinal}</div>
                                                <div className={`text-[9px] font-black px-2 py-0.5 rounded inline-block mt-1 ${tipoColegioFinal === 'LIBRE' ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-600'}`}>
                                                    {tipoColegioFinal}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-green-600 bg-green-50/30">{est.resultado.correctas}</td>
                                            <td className="px-6 py-4 text-center font-bold text-red-600 bg-red-50/30">{est.resultado.incorrectas}</td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-500">{est.resultado.enBlanco}</td>
                                            <td className="px-6 py-4 text-center">
                                                {est.resultado.esFalta ? (
                                                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded uppercase">No Presentado</span>
                                                ) : (
                                                    <div className="flex items-center justify-center text-gray-600 text-xs font-bold tracking-wider">
                                                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                                                        {formatearHoraExactaDB(est.resultado.horaSalida)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-xl text-blue-700 bg-blue-50/50">
                                                {est.resultado.puntajeTotal}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => { setAlumnoSeleccionado(est); setModalAbierto(true); }}
                                                    className="bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white p-2 rounded-lg transition-colors shadow-sm"
                                                    title="Ver detalle de respuestas"
                                                >
                                                    <Eye className="w-5 h-5 mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : dataCruda.length > 0 ? (
                <div className="bg-orange-50 p-12 text-center rounded-2xl border border-dashed border-orange-300">
                    <p className="text-orange-600 font-bold text-lg">Has desmarcado todos los colegios.</p>
                    <p className="text-orange-500 text-sm mt-1">Selecciona al menos uno arriba para generar el ranking.</p>
                </div>
            ) : null}

            {/* ========================================================= */}
            {/* MODAL INTELIGENTE DE VISUALIZACIÓN DE RESPUESTAS */}
            {/* ========================================================= */}
            {modalAbierto && alumnoSeleccionado && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-900 p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-white">Detalle de Ficha Óptica</h2>
                                <p className="text-gray-400 text-sm mt-1">{alumnoSeleccionado.apellidos}, {alumnoSeleccionado.nombres}</p>
                            </div>
                            <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-red-500 p-2 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {!alumnoSeleccionado.resultado.respuestasDetalle || !Array.isArray(alumnoSeleccionado.resultado.respuestasDetalle) ? (
                                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <p className="text-gray-500 font-bold">No hay detalle de alternativas guardado.</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {alumnoSeleccionado.resultado.esFalta
                                            ? "Este estudiante figura como NO PRESENTADO."
                                            : "Este examen fue registrado solo con los totales manuales."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                            <p className="text-[10px] font-black text-green-600 uppercase mb-1">Correctas</p>
                                            <p className="text-2xl font-black text-green-700">{alumnoSeleccionado.resultado.correctas}</p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                            <p className="text-[10px] font-black text-red-600 uppercase mb-1">Incorrectas</p>
                                            <p className="text-2xl font-black text-red-700">{alumnoSeleccionado.resultado.incorrectas}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">En Blanco</p>
                                            <p className="text-2xl font-black text-gray-700">{alumnoSeleccionado.resultado.enBlanco}</p>
                                        </div>
                                    </div>

                                    <div className="border rounded-xl overflow-hidden">
                                        <table className="w-full text-sm text-center">
                                            <thead className="bg-gray-100 font-bold text-gray-600 text-xs">
                                                <tr>
                                                    <th className="p-3">Pregunta</th>
                                                    <th className="p-3">Clave Oficial</th>
                                                    <th className="p-3">Marcó</th>
                                                    <th className="p-3">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {alumnoSeleccionado.resultado.respuestasDetalle.map((item: any, idx: number) => {
                                                    const correcta = clavesPlantilla[item.pregunta] || "-";
                                                    const marco = item.marcada || "-";
                                                    const esBlanco = marco === "-" || marco === "" || item.estado === "BLANCO";
                                                    const esCorrecta = marco === correcta && !esBlanco;

                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                            <td className="p-3 font-bold text-gray-700">N° {item.pregunta}</td>
                                                            <td className="p-3 font-black text-blue-600">{correcta}</td>
                                                            <td className="p-3 font-black text-gray-900">{marco}</td>
                                                            <td className="p-3">
                                                                {esBlanco ? (
                                                                    <span className="flex items-center justify-center text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded"><MinusCircle className="w-3 h-3 mr-1" /> BLANCO</span>
                                                                ) : esCorrecta ? (
                                                                    <span className="flex items-center justify-center text-green-700 text-xs font-bold bg-green-100 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3 mr-1" /> CORRECTO</span>
                                                                ) : (
                                                                    <span className="flex items-center justify-center text-red-700 text-xs font-bold bg-red-100 px-2 py-1 rounded"><XCircle className="w-3 h-3 mr-1" /> ERROR</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}