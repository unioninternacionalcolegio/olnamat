"use client"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegistroLibrePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [errorModal, setErrorModal] = useState("")
    const [successData, setSuccessData] = useState<{ dni: string } | null>(null)
    const [configuraciones, setConfiguraciones] = useState<any[]>([])
    const [file, setFile] = useState<File | null>(null)
    const [mostrarCuentas, setMostrarCuentas] = useState(false)

    // MODIFICADO: Ahora guarda un string para saber cuál se copió ("yape", "bcp" o "bbva")
    const [copiado, setCopiado] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        dni: "",
        nombres: "",
        apellidos: "",
        celular: "",
        colegio: "",
        localidad: "",
        nivel: "PRIMARIA",
        gradoOEdad: "",
        metodoPago: "YAPE",
        numeroOperacion: "",
        fechaPago: "",
        horaPago: ""
    })

    const getPeruCurrentDateTime = () => {
        const fecha = new Date().toLocaleDateString('en-CA', {
            timeZone: 'America/Lima'
        })

        const hora = new Date().toLocaleTimeString('en-CA', {
            timeZone: 'America/Lima',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })

        return { fechaPago: fecha, horaPago: hora }
    }

    // MODIFICADO: Función dinámica que recibe el texto a copiar y el ID del banco
    const manejarCopia = (texto: string, idBanco: string) => {
        navigator.clipboard.writeText(texto);
        setCopiado(idBanco);
        setTimeout(() => {
            setCopiado(null);
        }, 2000);
    };

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const res = await fetch("/api/configuracion")
                if (res.ok) {
                    const data = await res.json()
                    setConfiguraciones(data)
                }
            } catch (err) {
                console.error("Error cargando configuraciones", err)
            }
        }
        fetchConfigs()
    }, [])

    const gradosDisponibles = useMemo(() => {
        return Array.from(new Set(
            configuraciones
                .filter(c => c.nivel === formData.nivel)
                .map(c => c.gradoOEdad)
        ))
    }, [configuraciones, formData.nivel])

    useEffect(() => {
        if (gradosDisponibles.length > 0) {
            if (!gradosDisponibles.includes(formData.gradoOEdad)) {
                setFormData(prev => ({ ...prev, gradoOEdad: gradosDisponibles[0] as string }))
            }
        } else {
            if (formData.gradoOEdad !== "") {
                setFormData(prev => ({ ...prev, gradoOEdad: "" }))
            }
        }
    }, [gradosDisponibles, formData.gradoOEdad])

    useEffect(() => {
        const { fechaPago, horaPago } = getPeruCurrentDateTime()
        setFormData(prev => ({ ...prev, fechaPago, horaPago }))
    }, [])

    const configSeleccionada = useMemo(() => {
        return configuraciones.find(c =>
            c.nivel === formData.nivel &&
            c.gradoOEdad === formData.gradoOEdad
        )
    }, [configuraciones, formData.nivel, formData.gradoOEdad])

    const montoAPagar = configSeleccionada ? configSeleccionada.costoLibreReg : 0

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorModal("")

        if (!formData.dni || !formData.nombres || !formData.apellidos || !formData.colegio || !formData.gradoOEdad || !file) {
            setErrorModal("Por favor completa el DNI, nombres, apellidos, colegio, grado y adjunta tu voucher.")
            setLoading(false)
            return
        }
        const dniLimpio = formData.dni.trim();
        if (dniLimpio.length !== 8 || !/^\d{8}$/.test(dniLimpio)) {
            setErrorModal("El DNI debe contener exactamente 8 números.");
            setLoading(false);
            return;
        }
        if (!formData.numeroOperacion.trim()) {
            setErrorModal(`Es OBLIGATORIO ingresar el N° de Operación de tu ${formData.metodoPago === 'YAPE' ? 'Yape/Plin' : 'Transferencia'}.`);
            setLoading(false);
            return;
        }
        if (!formData.fechaPago || !formData.horaPago) {
            setErrorModal("Es OBLIGATORIO ingresar la FECHA y la HORA exacta del voucher para la validación.")
            setLoading(false)
            return
        }

        try {
            const uploadData = new FormData()
            uploadData.append('file', file)
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: uploadData
            })
            const uploadResult = await uploadRes.json()
            if (!uploadRes.ok) throw new Error(uploadResult.error || "Error al subir el voucher")

            const datosAEnviar = {
                ...formData,
                comprobanteUrl: uploadResult.url,
                institucion: `LIBRE-${formData.colegio.trim().toUpperCase()}`
            }

            const res = await fetch("/api/registro-libre", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosAEnviar),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Ocurrió un error al registrarse")

            setSuccessData({ dni: data.estudiante.dni })
        } catch (err: any) {
            setErrorModal(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (successData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
                    <h2 className="text-2xl font-black text-gray-900">¡Registro Enviado!</h2>
                    <p className="text-gray-600">Tu registro y pago están en revisión.</p>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-sm font-bold text-blue-600 mb-1">Tu Código de Estudiante es:</p>
                        <p className="text-3xl font-black text-blue-800">{successData.dni}</p>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                        Guarda este código. Con él podrás ver tus resultados publicados en la página.
                    </p>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-800 font-bold">
                        Acércate a uno de los locales o comunícate con nuestros números autorizados para recoger tu carnet de participación.
                    </div>
                    <button onClick={() => router.push("/")} className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition-all">
                        Volver al Inicio
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">

            {errorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center border-4 border-red-500 relative">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl font-black">!</div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase">Aviso</h3>
                        <p className="text-gray-700 font-medium text-lg leading-relaxed">{errorModal}</p>
                        <button onClick={() => setErrorModal("")} className="w-full bg-red-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-red-700 uppercase tracking-widest transition-all mt-4">
                            Entendido
                        </button>
                    </div>
                </div>
            )}

            {mostrarCuentas && (
                <div className="fixed inset-0 z-[40] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 relative border-4 border-blue-100">
                        <button onClick={() => setMostrarCuentas(false)} className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full font-black text-sm hover:bg-red-600 shadow-lg">X</button>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-blue-900 uppercase tracking-wide">Métodos de Pago</h3>
                            <p className="text-sm text-gray-500 font-medium">Realiza tu depósito o transferencia</p>
                        </div>
                        <div className="w-full h-48 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                            <img src="/yape-plin.jpg" alt="Yape Plin" className="w-50 h-50 object-cover" />
                        </div>

                        <div className="bg-blue-50 p-4 rounded-2xl space-y-3">

                            {/* YAPE / PLIN */}
                            <div className="border-b border-blue-100 pb-2">
                                <p className="text-[11px] text-blue-600 font-bold uppercase">Yape / Plin</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="font-black text-gray-800 text-lg">925 904 377</p>

                                    <button
                                        type="button"
                                        onClick={() => manejarCopia("925904377", "yape")}
                                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer"
                                        title="Copiar al portapapeles"
                                    >
                                        {copiado === "yape" ? (
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>

                                    {copiado === "yape" && (
                                        <span className="text-[11px] font-bold text-green-600 animate-fade-in">
                                            ¡Copiado!
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-center text-gray-500 italic mt-2">
                                    A nombre de: JOSUE RIVEROS CONOZCO
                                </p>
                            </div>

                            {/* BCP */}
                            <div className="border-b border-blue-100 pb-2">
                                <p className="text-[11px] text-blue-600 font-bold uppercase">BCP Soles</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="font-black text-gray-800 text-lg">355-07706069-0-44</p>

                                    <button
                                        type="button"
                                        onClick={() => manejarCopia("355-07706069-0-44", "bcp")}
                                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer"
                                        title="Copiar al portapapeles"
                                    >
                                        {copiado === "bcp" ? (
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>

                                    {copiado === "bcp" && (
                                        <span className="text-[11px] font-bold text-green-600 animate-fade-in">
                                            ¡Copiado!
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* BBVA */}
                            <div>
                                <p className="text-[11px] text-blue-600 font-bold uppercase">CCI BCP</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="font-black text-gray-800 text-lg">0002-35510770606904460</p>

                                    <button
                                        type="button"
                                        onClick={() => manejarCopia("0002-35510770606904460", "bbva")}
                                        className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer"
                                        title="Copiar al portapapeles"
                                    >
                                        {copiado === "bbva" ? (
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>

                                    {copiado === "bbva" && (
                                        <span className="text-[11px] font-bold text-green-600 animate-fade-in">
                                            ¡Copiado!
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p className="text-[10px] text-center text-gray-500 italic mt-2">A nombre de: JOSUE RIVEROS CONOZCO</p>
                        </div>

                        <button onClick={() => setMostrarCuentas(false)} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-700 uppercase text-sm tracking-widest transition-all">
                            Ya hice el pago
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-2xl w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Inscripción Alumno Libre</h2>
                    <p className="mt-2 text-sm text-gray-600">Completa tus datos y sube tu voucher de pago</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl mb-2">
                            <h3 className="font-bold text-blue-800 mb-2">1. Datos del Estudiante</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI *</label>
                                    <input name="dni" type="text" maxLength={8} required value={formData.dni} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ingresa tu DNI" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                                    <input name="celular" type="text" value={formData.celular} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Número de contacto" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                                    <input name="nombres" type="text" required value={formData.nombres} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                                    <input name="apellidos" type="text" required value={formData.apellidos} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de tu Colegio / Institución *</label>
                                    <input name="colegio" type="text" required value={formData.colegio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase" placeholder="Ej. San Juan Bosco" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Localidad / Ciudad *</label>
                                    <input name="localidad" type="text" required value={formData.localidad} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase" placeholder="Ej. Huancayo" />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-purple-50 p-4 rounded-xl mb-2">
                            <h3 className="font-bold text-purple-800 mb-2">2. Nivel y Grado a Concursar</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel *</label>
                                    <select name="nivel" value={formData.nivel} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold bg-white">
                                        <option value="INICIAL">INICIAL</option>
                                        <option value="PRIMARIA">PRIMARIA</option>
                                        <option value="SECUNDARIA">SECUNDARIA</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grado / Edad *</label>
                                    <select name="gradoOEdad" value={formData.gradoOEdad} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold bg-white">
                                        {gradosDisponibles.length === 0 && <option value="">Cargando grados...</option>}
                                        {gradosDisponibles.map(g => <option key={g as string} value={g as string}>{g as string}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-green-50 p-4 rounded-xl space-y-4">
                            <h3 className="font-bold text-green-800">3. Datos de Pago (Digital Exclusivo)</h3>

                            <div className="bg-yellow-100 border-2 border-yellow-300 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-center md:text-left">
                                    <p className="text-[11px] font-black uppercase text-yellow-700 tracking-wider">Monto a pagar</p>
                                    <p className="text-4xl font-black text-yellow-900">
                                        {montoAPagar > 0 ? `S/ ${montoAPagar.toFixed(2)}` : "S/ 0.00"}
                                    </p>
                                </div>
                                <button type="button" onClick={() => setMostrarCuentas(true)} className="bg-yellow-500 text-white font-black px-6 py-3 rounded-xl hover:bg-yellow-600 shadow-lg uppercase text-sm tracking-widest flex items-center gap-2 transition-all">
                                    <span>Ver Cuentas / Yape</span>
                                </button>
                            </div>

                            {/* ================= SELECCIÓN DE MÉTODO INTERACTIVO ================= */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona cómo realizaste el pago *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center font-bold uppercase transition-all ${formData.metodoPago === 'YAPE' ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                                        <input type="radio" name="metodoPago" value="YAPE" checked={formData.metodoPago === 'YAPE'} onChange={handleChange} className="sr-only" />
                                        Yape / Plin
                                    </label>
                                    <label className={`cursor-pointer border-2 rounded-xl p-3 flex items-center justify-center font-bold uppercase transition-all ${formData.metodoPago === 'TRANSFERENCIA' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                                        <input type="radio" name="metodoPago" value="TRANSFERENCIA" checked={formData.metodoPago === 'TRANSFERENCIA'} onChange={handleChange} className="sr-only" />
                                        Transferencia
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Voucher de Pago (Imagen) *</label>
                                    <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" />
                                </div>
                                <div className="md:col-span-2">
                                    {/* AHORA ES OBLIGATORIO Y CAMBIA EL TEXTO SEGÚN LO SELECCIONADO */}
                                    <label className="block text-sm font-medium text-red-600 mb-1">
                                        N° de Operación ({formData.metodoPago === 'YAPE' ? 'Yape/Plin' : 'Transferencia'}) *
                                    </label>
                                    <input name="numeroOperacion" type="text" required value={formData.numeroOperacion} onChange={handleChange} className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-red-50" placeholder="Ingresa los dígitos de la operación" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Pago *</label>
                                    <input name="fechaPago" type="date" required value={formData.fechaPago} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 text-red-600">Hora Exacta del Pago *</label>
                                    <input name="horaPago" type="time" required value={formData.horaPago} onChange={handleChange} className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500 bg-red-50" />
                                </div>
                            </div>
                        </div>
                    </div>
                     {/* 
                    <div className="pt-4">
                      <button type="submit" disabled={loading} className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 shadow-xl transition-all">
                            {loading ? "Procesando..." : "Enviar Registro y Voucher"}
                        </button>
                    </div>
                    */}
                </form>
            </div>
        </div>
    )
}