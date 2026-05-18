"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Plus, Trash2, Calculator, Upload, Info, Image as ImageIcon, Clock, Building2, Ticket, CheckCircle, XCircle, Wallet, QrCode, Landmark, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import imageCompression from 'browser-image-compression'
import ImportarExcel from "@/components/ImportarExcel"

const OPCIONES_GRADOS = {
    INICIAL: ["3 años", "4 años", "5 años"],
    PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    SECUNDARIA: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
}

// Función para obtener la hora actual exacta en Perú en formato para el input datetime-local
const getHoraPeruLocal = () => {
    try {
        const opciones: Intl.DateTimeFormatOptions = {
            timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
        };
        const formateador = new Intl.DateTimeFormat('sv-SE', opciones);
        return formateador.format(new Date()).replace(' ', 'T');
    } catch (e) {
        // Fallback genérico si el navegador no soporta sv-SE
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    }
}

export default function FormInscripcion({
    precios,
    userInstitucion = "",
    userTipoColegio = "ESTATAL",
    nivelFijo
}: {
    precios: any[],
    userInstitucion?: string,
    userTipoColegio?: string,
    nivelFijo?: "INICIAL" | "PRIMARIA" | "SECUNDARIA"
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [dnisDuplicados, setDnisDuplicados] = useState<number[]>([])
    const [opsDuplicadas, setOpsDuplicadas] = useState<number[]>([])
    const [vouchersFiles, setVouchersFiles] = useState<Record<number, { file: File, preview: string }>>({})

    const [codigoCuponInput, setCodigoCuponInput] = useState("")
    const [cuponAplicado, setCuponAplicado] = useState<{ codigo: string, monto: number } | null>(null)
    const [estadoCupon, setEstadoCupon] = useState<"idle" | "loading" | "error">("idle")
    const [errorCuponMsg, setErrorCuponMsg] = useState("")

    const defaultNivel = nivelFijo || "PRIMARIA"
    const defaultGrado = OPCIONES_GRADOS[defaultNivel][0]

    const { register, control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            alumnos: [{
                nombres: "", apellidos: "", dni: "",
                nivel: defaultNivel, gradoOEdad: defaultGrado,
                tipoColegio: userTipoColegio, institucion: userInstitucion
            }],
            pagos: [{
                metodo: "YAPE",
                monto: "",
                numeroOperacion: "",
                fechaHoraPago: getHoraPeruLocal()
            }]
        }
    })

    const { fields: alumnosFields, append: appendAlumno, remove: removeAlumno } = useFieldArray({ control, name: "alumnos" })
    const { fields: pagosFields, append: appendPago, remove: removePago } = useFieldArray({ control, name: "pagos" })

    const alumnosWatch = watch("alumnos")
    const pagosWatch = watch("pagos")

    // Cálculos Monetarios
    const subTotalPagar = alumnosWatch.reduce((acc, alum) => {
        const config = precios.find(p => p.nivel === alum.nivel && p.gradoOEdad === alum.gradoOEdad)
        if (!config) return acc + 15;
        let costo = config.costoEstatalReg;
        if (alum.tipoColegio === 'PARTICULAR') costo = config.costoParticularReg;
        if (alum.tipoColegio === 'LIBRE') costo = config.costoLibreReg;
        return acc + costo;
    }, 0)

    const descuentoMonto = cuponAplicado ? cuponAplicado.monto : 0
    const totalFinal = Math.max(0, subTotalPagar - descuentoMonto)

    const totalAbonado = pagosWatch.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)
    const diferencia = totalFinal - totalAbonado
    const incentivo = Math.floor(alumnosWatch.length / 10)

    const handleImportedData = (nuevosAlumnos: any[]) => {
        const alumnosConColegio = nuevosAlumnos.map(alum => ({
            ...alum, nivel: nivelFijo || alum.nivel || "PRIMARIA",
            tipoColegio: alum.tipoColegio || userTipoColegio,
            institucion: alum.institucion || userInstitucion
        }))
        setValue("alumnos", alumnosConColegio)
    }

    const handleVoucherChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setVouchersFiles(prev => ({ ...prev, [index]: { file, preview: URL.createObjectURL(file) } }))
        }
    }

    // VALIDACIÓN INTELIGENTE DE DNI
    const verificarDniIndividual = async (dni: string, index: number) => {
        if (!dni || dni.length < 8) {
            setDnisDuplicados(prev => prev.filter(i => i !== index)); return;
        }
        try {
            const res = await fetch('/api/estudiantes/verificar-dnis', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dnis: [dni] })
            })
            const data = await res.json()
            if (data.registrados?.includes(dni) && !dnisDuplicados.includes(index)) {
                setDnisDuplicados([...dnisDuplicados, index])
            } else if (!data.registrados?.includes(dni)) {
                setDnisDuplicados(prev => prev.filter(i => i !== index))
            }
        } catch (error) { console.error("Error verificando DNI:", error) }
    }

    // VALIDACIÓN INTELIGENTE DE NRO OPERACIÓN
    const verificarNumeroOperacion = async (nroOperacion: string, index: number) => {
        if (!nroOperacion || nroOperacion.length < 4) {
            setOpsDuplicadas(prev => prev.filter(i => i !== index)); return;
        }
        try {
            const res = await fetch(`/api/pagos/verificar?operacion=${nroOperacion}`)
            const data = await res.json()
            if (data.existe && !opsDuplicadas.includes(index)) {
                setOpsDuplicadas([...opsDuplicadas, index])
            } else if (!data.existe) {
                setOpsDuplicadas(prev => prev.filter(i => i !== index))
            }
        } catch (error) { console.error("Error verificando Nro Operación:", error) }
    }

    const verificarCupon = async () => {
        if (!codigoCuponInput.trim()) return
        setEstadoCupon("loading"); setErrorCuponMsg("")
        try {
            const res = await fetch(`/api/delegado/verificar-cupon?codigo=${codigoCuponInput.toUpperCase()}`)
            const data = await res.json()
            if (!res.ok) {
                setEstadoCupon("error"); setErrorCuponMsg(data.error || "Cupón inválido"); return;
            }
            setCuponAplicado({ codigo: data.codigo, monto: data.monto })
            setEstadoCupon("idle"); setCodigoCuponInput("")
        } catch (error) {
            setEstadoCupon("error"); setErrorCuponMsg("Error al verificar")
        }
    }

    const onSubmit = async (data: any) => {
        if (diferencia !== 0 && totalFinal > 0) return alert(`Los pagos no cuadran. Falta abonar S/ ${diferencia.toFixed(2)}`)

        setLoading(true)
        try {
            const pagosProcesados = await Promise.all(data.pagos.map(async (pago: any, index: number) => {
                let comprobanteUrl = null;
                const voucher = vouchersFiles[index];

                if (voucher && pago.metodo !== "EFECTIVO") {
                    const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true }
                    const compressedFile = await imageCompression(voucher.file, options)
                    const formData = new FormData()
                    formData.append("file", compressedFile, voucher.file.name)

                    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
                    const uploadData = await uploadRes.json()
                    if (!uploadRes.ok) throw new Error(uploadData.error || "Error subiendo imagen")
                    comprobanteUrl = uploadData.url;
                }

                return {
                    metodo: pago.metodo,
                    monto: Number(pago.monto),
                    numeroOperacion: pago.numeroOperacion,
                    fechaHoraPago: new Date(pago.fechaHoraPago).toISOString(),
                    comprobanteUrl
                }
            }))

            const payload = {
                estudiantes: data.alumnos,
                montoTotal: subTotalPagar,
                codigoCupon: cuponAplicado?.codigo,
                pagosParciales: pagosProcesados
            }

            const res = await fetch("/api/delegado/inscripcion", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Error al inscribir en la base de datos")
            }

            alert("¡Inscripción y pagos registrados con éxito!")
            router.push("/delegado/mis-pagos")
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* --- SECCIÓN 1: DATOS BANCARIOS INFORMATIVOS --- */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 rounded-2xl shadow-sm text-white border border-blue-700">
                <h3 className="font-bold flex items-center mb-4 text-lg"><Landmark className="w-5 h-5 mr-2" /> Cuentas Autorizadas para Recaudación</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20 flex flex-col items-center text-center">
                        <QrCode className="w-12 h-12 text-green-400 mb-2" />
                        <h4 className="font-black text-xl text-green-400">YAPE / PLIN</h4>
                        <p className="text-2xl font-bold tracking-widest mt-1">999 999 999</p>
                        <p className="text-sm text-blue-200 mt-1">Titular: Juan Perez (Tesorero)</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20 flex flex-col justify-center text-center">
                        <h4 className="font-black text-lg text-blue-300">Banco de la Nación</h4>
                        <p className="text-xl font-bold mt-2">04-000-000000</p>
                        <p className="text-sm text-blue-200 mt-1">CCI: 018-000-00400000000-00</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl border border-white/20 flex flex-col justify-center text-center">
                        <h4 className="font-black text-lg text-amber-400">Banco BCP</h4>
                        <p className="text-xl font-bold mt-2">123-4567890-1-23</p>
                        <p className="text-sm text-blue-200 mt-1">CCI: 002-123-004567890123-00</p>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: ALUMNOS --- */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        {nivelFijo ? `Estudiantes - Nivel ${nivelFijo}` : "Estudiantes a Inscribir"}
                    </h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <ImportarExcel onDataImported={handleImportedData} />
                        <button type="button" onClick={() => appendAlumno({ nombres: "", apellidos: "", dni: "", nivel: defaultNivel, gradoOEdad: defaultGrado, tipoColegio: userTipoColegio, institucion: userInstitucion })} className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition">
                            <Plus className="w-5 h-5" /> <span>Agregar Manual</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {alumnosFields.map((field, index) => {
                        const nivelActual = (nivelFijo || alumnosWatch[index]?.nivel || "PRIMARIA") as keyof typeof OPCIONES_GRADOS;
                        const gradoActual = alumnosWatch[index]?.gradoOEdad || OPCIONES_GRADOS[nivelActual][0];
                        const tipoColegioActual = alumnosWatch[index]?.tipoColegio || "ESTATAL";

                        const configAlumno = precios.find(p => p.nivel === nivelActual && p.gradoOEdad === gradoActual);
                        let costoAlumno = 0;
                        if (configAlumno) {
                            if (tipoColegioActual === 'ESTATAL') costoAlumno = configAlumno.costoEstatalReg;
                            if (tipoColegioActual === 'PARTICULAR') costoAlumno = configAlumno.costoParticularReg;
                            if (tipoColegioActual === 'LIBRE') costoAlumno = configAlumno.costoLibreReg;
                        }

                        return (
                            <div key={field.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 relative shadow-sm hover:shadow-md transition-shadow">
                                <button type="button" onClick={() => removeAlumno(index)} className="absolute -top-3 -right-3 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-full transition-colors shadow-sm" title="Eliminar Alumno">
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 relative">
                                    <div className="md:col-span-1 relative">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">DNI</label>
                                        <input {...register(`alumnos.${index}.dni`)} onBlur={(e) => verificarDniIndividual(e.target.value, index)} placeholder="Obligatorio" className={`w-full p-2.5 border rounded-lg text-sm bg-white ${dnisDuplicados.includes(index) ? 'border-red-500 bg-red-50 focus:ring-red-500' : ''}`} />

                                        {/* ALERTA FLOTANTE DNI */}
                                        {dnisDuplicados.includes(index) && (
                                            <div className="absolute top-[-30px] left-0 bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg font-bold flex items-center z-10 animate-bounce">
                                                <AlertCircle className="w-3 h-3 mr-1" /> DNI ya inscrito en el sistema
                                                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-red-600 rotate-45"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-1 md:col-span-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nombres</label>
                                        <input {...register(`alumnos.${index}.nombres`)} required className="w-full p-2.5 border rounded-lg text-sm bg-white uppercase" />
                                    </div>
                                    <div className="md:col-span-2 md:col-span-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Apellidos</label>
                                        <input {...register(`alumnos.${index}.apellidos`)} required className="w-full p-2.5 border rounded-lg text-sm bg-white uppercase" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nivel / Grado</label>
                                        <div className="flex space-x-2">
                                            <select {...register(`alumnos.${index}.nivel`)} className={`w-1/2 p-2.5 border rounded-lg text-sm font-bold ${nivelFijo ? "bg-gray-200 text-gray-500 pointer-events-none" : "bg-white text-blue-700"}`}>
                                                {nivelFijo ? <option value={nivelFijo}>{nivelFijo}</option> : <><option value="INICIAL">INICIAL</option><option value="PRIMARIA">PRIMARIA</option><option value="SECUNDARIA">SECUNDARIA</option></>}
                                            </select>
                                            <select {...register(`alumnos.${index}.gradoOEdad`)} className="w-1/2 p-2.5 border rounded-lg text-sm bg-white text-gray-700" required>
                                                {OPCIONES_GRADOS[nivelActual].map(grado => <option key={grado} value={grado}>{grado}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* AHORA SON EDITABLES */}
                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Tipo Colegio</label>
                                            <select {...register(`alumnos.${index}.tipoColegio`)} className="w-full p-2.5 border rounded-lg text-sm bg-white text-gray-700 font-bold focus:ring-2 focus:ring-blue-500">
                                                <option value="ESTATAL">Estatal Nacional</option>
                                                <option value="PARTICULAR">Particular Privado</option>
                                                <option value="LIBRE">Alumno Libre</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nombre Institución</label>
                                            <div className="flex items-center relative">
                                                <Building2 className="w-4 h-4 text-gray-400 absolute ml-3" />
                                                <input {...register(`alumnos.${index}.institucion`)} placeholder="Nombre del Colegio" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm bg-white text-gray-700 uppercase font-bold focus:ring-2 focus:ring-blue-500" required />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-lg border border-blue-100 text-sm">
                                    <div className="flex items-center text-blue-800 font-medium mb-2 sm:mb-0">
                                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                        {configAlumno ? <span><strong>{configAlumno.turno}</strong> ({configAlumno.horaInicio} - {configAlumno.horaFin})</span> : <span className="text-red-500 italic">Configuración no encontrada</span>}
                                    </div>
                                    <div className="flex items-center text-green-700 font-bold bg-green-50 px-3 py-1 rounded-full">
                                        <Ticket className="w-4 h-4 mr-1" /> Tarifa: S/ {costoAlumno.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* --- SECCIÓN 3: PAGOS PARCIALES Y RESUMEN --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h3 className="font-bold text-gray-800 flex items-center"><Wallet className="w-5 h-5 mr-2 text-blue-600" /> Múltiples Operaciones / Recibos</h3>
                        <button type="button" onClick={() => appendPago({ metodo: "YAPE", monto: "", numeroOperacion: "", fechaHoraPago: getHoraPeruLocal() })} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold flex items-center hover:bg-blue-100">
                            <Plus className="w-4 h-4 mr-1" /> Añadir Otro Pago
                        </button>
                    </div>

                    {totalFinal > 0 && pagosFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 border border-gray-200 rounded-xl relative bg-white shadow-sm">
                            {pagosFields.length > 1 && (
                                <button type="button" onClick={() => { removePago(index); setVouchersFiles(prev => { const c = { ...prev }; delete c[index]; return c }) }} className="absolute -top-3 -right-3 bg-red-100 text-red-600 p-1.5 rounded-full shadow-sm"><Trash2 className="w-4 h-4" /></button>
                            )}

                            <div className="md:col-span-3">
                                <label className="text-xs font-bold text-gray-500">Método de Pago</label>
                                <select {...register(`pagos.${index}.metodo`)} className="w-full p-2.5 border rounded-lg bg-gray-50 mt-1 text-sm font-bold">
                                    <option value="YAPE">Yape</option><option value="PLIN">Plin</option><option value="TRANSFERENCIA">Transferencia / Depósito</option><option value="EFECTIVO">Efectivo (en Caja)</option>
                                </select>
                            </div>

                            <div className="md:col-span-3">
                                <label className="text-xs font-bold text-gray-500">Monto Abonado (S/)</label>
                                <input type="number" step="0.01" {...register(`pagos.${index}.monto`)} required placeholder="Ej: 300.00" className="w-full p-2.5 border rounded-lg bg-blue-50 mt-1 text-sm font-black text-blue-700 focus:ring-blue-500" />
                            </div>

                            <div className="md:col-span-6 relative">
                                <label className="text-xs font-bold text-gray-500">Fecha y Hora (Perú)</label>
                                <input type="datetime-local" {...register(`pagos.${index}.fechaHoraPago`)} required className="w-full p-2.5 border rounded-lg bg-gray-50 mt-1 text-sm font-medium" />
                            </div>

                            {pagosWatch[index]?.metodo !== "EFECTIVO" && (
                                <>
                                    <div className="md:col-span-6 relative">
                                        <label className="text-xs font-bold text-gray-500">Nro de Operación / Referencia</label>
                                        <input {...register(`pagos.${index}.numeroOperacion`)} onBlur={(e) => verificarNumeroOperacion(e.target.value, index)} required placeholder="Ej: 054879" className={`w-full p-2.5 border rounded-lg bg-gray-50 mt-1 text-sm ${opsDuplicadas.includes(index) ? 'border-red-500 focus:ring-red-500' : ''}`} />

                                        {/* ALERTA FLOTANTE OPERACIÓN */}
                                        {opsDuplicadas.includes(index) && (
                                            <div className="absolute top-[10px] right-0 bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg font-bold flex items-center z-10 animate-bounce">
                                                <AlertCircle className="w-3 h-3 mr-1" /> Ya registrado
                                                <div className="absolute top-3 -right-1 w-2 h-2 bg-red-600 rotate-45"></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-6">
                                        <label className="text-xs font-bold text-gray-500">Foto del Voucher (Requerido)</label>
                                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg h-[46px] mt-1 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:bg-gray-100 transition">
                                            {vouchersFiles[index] ? (
                                                <div className="flex items-center justify-between w-full px-3">
                                                    <span className="text-xs text-green-700 font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Imagen OK</span>
                                                    <img src={vouchersFiles[index].preview} alt="preview" className="h-8 w-8 object-cover rounded shadow-sm" />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-bold flex items-center"><ImageIcon className="w-4 h-4 mr-2" /> Clic para subir foto</span>
                                            )}
                                            <input type="file" accept="image/*" onChange={(e) => handleVoucherChange(index, e)} required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {totalFinal === 0 && <p className="text-sm text-green-600 font-bold p-4 bg-green-50 rounded-lg flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> El total está cubierto por el cupón. No se requieren pagos adicionales.</p>}
                </div>

                {/* --- ZONA LATERAL: RESUMEN Y CUPONES --- */}
                <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white space-y-6">
                    <h3 className="font-bold flex items-center text-lg"><Calculator className="w-6 h-6 mr-2" /> Resumen de Cuenta</h3>

                    <div className="bg-blue-700/50 p-3 rounded-xl border border-blue-500/50">
                        <label className="text-[10px] font-bold text-blue-200">CUPÓN DE DESCUENTO ESPECIAL</label>
                        {!cuponAplicado ? (
                            <div className="flex gap-2 mt-1">
                                <input type="text" value={codigoCuponInput} onChange={(e) => setCodigoCuponInput(e.target.value)} className="w-full p-2 bg-blue-800/50 rounded-lg text-sm text-white uppercase border border-blue-500" placeholder="CÓDIGO" />
                                <button type="button" onClick={verificarCupon} disabled={!codigoCuponInput} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg text-sm font-bold transition">Aplicar</button>
                            </div>
                        ) : (
                            <div className="flex justify-between bg-green-500/20 p-2 rounded-lg mt-1 border border-green-500/30">
                                <span className="text-green-300 text-sm font-bold flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> {cuponAplicado.codigo}</span>
                                <button type="button" onClick={() => setCuponAplicado(null)} className="text-red-300 text-xs hover:underline">Quitar</button>
                            </div>
                        )}
                        {estadoCupon === "error" && <p className="text-xs text-red-300 mt-1 flex items-center"><XCircle className="w-3 h-3 mr-1" /> {errorCuponMsg}</p>}
                    </div>

                    <div className="space-y-2 text-sm text-blue-100 border-b border-blue-500/50 pb-4">
                        <div className="flex justify-between"><span>Estudiantes Inscriptos ({alumnosWatch.length}):</span><span>S/ {subTotalPagar.toFixed(2)}</span></div>
                        {cuponAplicado && <div className="flex justify-between text-green-300 font-bold"><span>Descuento Cupón:</span><span>- S/ {cuponAplicado.monto.toFixed(2)}</span></div>}
                    </div>

                    <div className="flex justify-between items-end">
                        <span className="text-sm">TOTAL A PAGAR:</span>
                        <span className="text-3xl font-black">S/ {totalFinal.toFixed(2)}</span>
                    </div>

                    <div className={`p-4 rounded-xl flex justify-between items-center transition-colors ${diferencia === 0 ? 'bg-green-500 text-white shadow-inner' : diferencia < 0 ? 'bg-red-500 text-white' : 'bg-blue-800 border border-blue-500 text-blue-100'}`}>
                        <span className="text-xs font-bold uppercase tracking-widest">Suma Abonada:</span>
                        <span className="text-xl font-bold">S/ {totalAbonado.toFixed(2)}</span>
                    </div>

                    {diferencia > 0 && <p className="text-sm text-amber-300 font-bold text-center mt-2 flex justify-center items-center"><AlertCircle className="w-4 h-4 mr-1" /> Falta abonar: S/ {diferencia.toFixed(2)}</p>}
                    {diferencia < 0 && <p className="text-sm text-red-300 font-bold text-center mt-2 flex justify-center items-center"><AlertCircle className="w-4 h-4 mr-1" /> Exceso de abono: S/ {Math.abs(diferencia).toFixed(2)}</p>}

                    <button type="submit" disabled={loading || alumnosWatch.length === 0 || dnisDuplicados.length > 0 || opsDuplicadas.length > 0 || (totalFinal > 0 && diferencia !== 0)} className="w-full bg-white text-blue-600 py-4 rounded-xl font-black text-lg shadow-xl hover:bg-gray-50 transition disabled:bg-blue-400 disabled:text-blue-200 disabled:shadow-none disabled:cursor-not-allowed">
                        {loading ? "Procesando Operación..." : "Finalizar Inscripción y Pagar"}
                    </button>
                </div>
            </div>
        </form>
    )
}