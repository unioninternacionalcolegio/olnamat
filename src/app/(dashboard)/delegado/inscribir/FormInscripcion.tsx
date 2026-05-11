//app/(dashboard)/delegado/inscribir/FormInscripcion.tsx
"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Plus, Trash2, Calculator, Upload, Info, Image as ImageIcon, Clock, Building2, Ticket, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import imageCompression from 'browser-image-compression'
import ImportarExcel from "@/components/ImportarExcel"

const OPCIONES_GRADOS = {
    INICIAL: ["3 años", "4 años", "5 años"],
    PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    SECUNDARIA: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
}

export default function FormInscripcion({
    precios,
    userInstitucion = "Independiente",
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
    const [imagenVoucher, setImagenVoucher] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // ESTADOS DEL CUPÓN
    const [codigoCuponInput, setCodigoCuponInput] = useState("")
    const [cuponAplicado, setCuponAplicado] = useState<{ codigo: string, monto: number } | null>(null)
    const [estadoCupon, setEstadoCupon] = useState<"idle" | "loading" | "error">("idle")
    const [errorCuponMsg, setErrorCuponMsg] = useState("")

    const defaultNivel = nivelFijo || "PRIMARIA"
    const defaultGrado = OPCIONES_GRADOS[defaultNivel][0]

    const { register, control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            alumnos: [{
                nombres: "",
                apellidos: "",
                dni: "",
                nivel: defaultNivel,
                gradoOEdad: defaultGrado,
                tipoColegio: userTipoColegio,
                institucion: userInstitucion
            }],
            metodo: "YAPE",
            numeroOperacion: ""
        }
    })

    const { fields, append, remove } = useFieldArray({ control, name: "alumnos" })
    const alumnosWatch = watch("alumnos")

    // Calculamos el subtotal (antes de descuentos)
    const subTotalPagar = alumnosWatch.reduce((acc, alum) => {
        const config = precios.find(p => p.nivel === alum.nivel && p.gradoOEdad === alum.gradoOEdad)
        if (!config) return acc + 15;

        let costo = config.costoEstatalReg;
        if (alum.tipoColegio === 'PARTICULAR') costo = config.costoParticularReg;
        if (alum.tipoColegio === 'LIBRE') costo = config.costoLibreReg;

        return acc + costo;
    }, 0)

    // Calculamos el total final aplicando el cupón (no permitiendo que sea negativo)
    const descuentoMonto = cuponAplicado ? cuponAplicado.monto : 0
    const totalFinal = Math.max(0, subTotalPagar - descuentoMonto)

    const incentivo = Math.floor(alumnosWatch.length / 10)

    const handleImportedData = (nuevosAlumnos: any[]) => {
        const alumnosConColegio = nuevosAlumnos.map(alum => ({
            ...alum,
            nivel: nivelFijo || alum.nivel || "PRIMARIA",
            tipoColegio: userTipoColegio,
            institucion: userInstitucion
        }))
        setValue("alumnos", alumnosConColegio)
        alert(`Se importaron ${alumnosConColegio.length} estudiantes correctamente.`)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImagenVoucher(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }
    const [dnisDuplicados, setDnisDuplicados] = useState<number[]>([]) // Guardará los índices de los alumnos con error

    const verificarDniIndividual = async (dni: string, index: number) => {
        if (!dni || dni.length < 8) {
            // Si lo borró, quitamos el error
            setDnisDuplicados(prev => prev.filter(i => i !== index))
            return;
        }

        try {
            const res = await fetch('/api/estudiantes/verificar-dnis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dnis: [dni] })
            })
            const data = await res.json()

            if (data.registrados && data.registrados.includes(dni)) {
                // Existe, agregamos el índice a los errores
                if (!dnisDuplicados.includes(index)) {
                    setDnisDuplicados([...dnisDuplicados, index])
                }
            } else {
                // No existe, quitamos el error
                setDnisDuplicados(prev => prev.filter(i => i !== index))
            }
        } catch (error) {
            console.error(error)
        }
    }
    // FUNCIÓN PARA VERIFICAR EL CUPÓN
    const verificarCupon = async () => {
        if (!codigoCuponInput.trim()) return

        setEstadoCupon("loading")
        setErrorCuponMsg("")

        try {
            const res = await fetch(`/api/delegado/verificar-cupon?codigo=${codigoCuponInput.toUpperCase()}`)
            const data = await res.json()

            if (!res.ok) {
                setEstadoCupon("error")
                setErrorCuponMsg(data.error || "Cupón no válido")
                return
            }

            setCuponAplicado({ codigo: data.codigo, monto: data.monto })
            setEstadoCupon("idle")
            setCodigoCuponInput("")
        } catch (error) {
            setEstadoCupon("error")
            setErrorCuponMsg("Error al verificar")
        }
    }

    const quitarCupon = () => {
        setCuponAplicado(null)
        setEstadoCupon("idle")
        setErrorCuponMsg("")
    }

    const onSubmit = async (data: any) => {
        // Permitir continuar sin voucher SOLO SI el total final es 0 (ej: cubierto 100% por cupón)
        if (!imagenVoucher && totalFinal > 0) return alert("Por favor, sube la foto de tu voucher de pago.")

        setLoading(true)
        try {
            let voucherUrl = null;

            // Solo subimos la imagen si existe
            if (imagenVoucher) {
                const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true }
                const compressedFile = await imageCompression(imagenVoucher, options)

                const formData = new FormData()
                formData.append("file", compressedFile, imagenVoucher.name)

                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
                const uploadData = await uploadRes.json()

                if (!uploadRes.ok) throw new Error(uploadData.error || "Error subiendo imagen")
                voucherUrl = uploadData.url;
            }

            const res = await fetch("/api/delegado/inscripcion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    estudiantes: data.alumnos,
                    montoTotal: subTotalPagar, // Enviamos el subtotal, el backend restará el cupón por seguridad
                    codigoCupon: cuponAplicado?.codigo, // Enviamos el código para que el backend lo aplique
                    metodo: data.metodo,
                    numeroOperacion: data.numeroOperacion,
                    comprobanteUrl: voucherUrl
                })
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || "Error al inscribir en la base de datos")
            }

            alert("¡Inscripción y pago registrados con éxito!")
            router.push("/delegado/mis-pagos")
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        {nivelFijo ? `Inscripción - Nivel ${nivelFijo}` : "Inscripción General"}
                    </h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <ImportarExcel onDataImported={handleImportedData} />
                        <button
                            type="button"
                            onClick={() => append({
                                nombres: "", apellidos: "", dni: "",
                                nivel: defaultNivel, gradoOEdad: defaultGrado,
                                tipoColegio: userTipoColegio, institucion: userInstitucion
                            })}
                            className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition flex-1 sm:flex-none justify-center"
                        >
                            <Plus className="w-5 h-5" /> <span>Agregar Manual</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {fields.map((field, index) => {
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
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="absolute -top-3 -right-3 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-full transition-colors shadow-sm"
                                    title="Eliminar Alumno"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">DNI</label>
                                        <input
                                            {...register(`alumnos.${index}.dni`)}
                                            placeholder="Opcional"
                                            className={`w-full p-2.5 border rounded-lg text-sm bg-white ${dnisDuplicados.includes(index) ? 'border-red-500 bg-red-50 focus:ring-red-500' : ''}`}
                                            onBlur={(e) => verificarDniIndividual(e.target.value, index)} // AQUI VA EL EVENTO
                                        />
                                        {dnisDuplicados.includes(index) && (
                                            <span className="text-[10px] text-red-500 font-bold mt-1 flex items-center">
                                                <XCircle className="w-3 h-3 mr-1" /> DNI ya registrado
                                            </span>
                                        )}
                                    </div>
                                    <div className="md:col-span-1 md:col-span-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nombres</label>
                                        <input {...register(`alumnos.${index}.nombres`)} placeholder="Nombres" className="w-full p-2.5 border rounded-lg text-sm bg-white uppercase" required />
                                    </div>
                                    <div className="md:col-span-2 md:col-span-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Apellidos</label>
                                        <input {...register(`alumnos.${index}.apellidos`)} placeholder="Apellidos" className="w-full p-2.5 border rounded-lg text-sm bg-white uppercase" required />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nivel / Grado</label>
                                        <div className="flex space-x-2">
                                            <select
                                                {...register(`alumnos.${index}.nivel`)}
                                                className={`w-1/2 p-2.5 border rounded-lg text-sm font-bold ${nivelFijo ? "bg-gray-200 text-gray-500 pointer-events-none" : "bg-white text-blue-700"}`}
                                            >
                                                {nivelFijo ? (
                                                    <option value={nivelFijo}>{nivelFijo}</option>
                                                ) : (
                                                    <>
                                                        <option value="INICIAL">INICIAL</option>
                                                        <option value="PRIMARIA">PRIMARIA</option>
                                                        <option value="SECUNDARIA">SECUNDARIA</option>
                                                    </>
                                                )}
                                            </select>

                                            <select {...register(`alumnos.${index}.gradoOEdad`)} className="w-1/2 p-2.5 border rounded-lg text-sm bg-white text-gray-700" required>
                                                {OPCIONES_GRADOS[nivelActual].map(grado => (
                                                    <option key={grado} value={grado}>{grado}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-1">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Tipo Colegio</label>
                                            <select {...register(`alumnos.${index}.tipoColegio`)} className="w-full p-2.5 border rounded-lg text-sm bg-gray-100 text-gray-600 font-bold pointer-events-none">
                                                <option value={userTipoColegio}>
                                                    {userTipoColegio === 'ESTATAL' ? 'Estatal Nacional' : userTipoColegio === 'PARTICULAR' ? 'Particular Privado' : 'Alumno Libre'}
                                                </option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nombre Institución</label>
                                            <div className="flex items-center">
                                                <Building2 className="w-4 h-4 text-gray-400 absolute ml-3" />
                                                <input {...register(`alumnos.${index}.institucion`)} placeholder="Institución Educativa" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm bg-gray-100 text-gray-600 uppercase pointer-events-none font-bold" readOnly />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-lg border border-blue-100 text-sm">
                                    <div className="flex items-center text-blue-800 font-medium mb-2 sm:mb-0">
                                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                        {configAlumno ? (
                                            <span><strong>{configAlumno.turno}</strong> ({configAlumno.horaInicio} - {configAlumno.horaFin})</span>
                                        ) : (
                                            <span className="text-red-500 italic">Configuración no encontrada</span>
                                        )}
                                    </div>
                                    <div className="flex items-center text-green-700 font-bold bg-green-50 px-3 py-1 rounded-full">
                                        <Ticket className="w-4 h-4 mr-1" />
                                        Tarifa: S/ {costoAlumno.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* PANEL DE PAGO Y RESUMEN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center"><Upload className="w-5 h-5 mr-2" /> Datos del Pago</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Método</label>
                                <select {...register("metodo")} className="w-full p-3 border rounded-xl bg-gray-50 mt-1">
                                    <option value="YAPE">Yape</option>
                                    <option value="PLIN">Plin</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="EFECTIVO">Efectivo en Caja</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Nro Operación</label>
                                <input {...register("numeroOperacion")} required={totalFinal > 0} placeholder="Ej: 054879" className="w-full p-3 border rounded-xl bg-gray-50 mt-1" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Foto del Voucher</label>
                            <div className="relative border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">Haz clic para subir imagen</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            {previewUrl && <p className="text-[10px] text-green-600 mt-1 font-bold text-right">Imagen lista</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white space-y-6">
                    <h3 className="font-bold flex items-center text-lg"><Calculator className="w-6 h-6 mr-2" /> Resumen</h3>

                    {/* ZONA DE CUPÓN DE DESCUENTO */}
                    <div className="bg-blue-700/50 p-3 rounded-xl border border-blue-500/50">
                        <label className="text-[10px] font-bold text-blue-200 uppercase mb-2 block tracking-wider">Cupón de Descuento</label>

                        {!cuponAplicado ? (
                            <div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={codigoCuponInput}
                                        onChange={(e) => setCodigoCuponInput(e.target.value)}
                                        placeholder="Código"
                                        className="w-full p-2 bg-blue-800/50 border border-blue-400/50 rounded-lg text-sm text-white placeholder:text-blue-300 uppercase font-bold"
                                    />
                                    <button
                                        type="button"
                                        onClick={verificarCupon}
                                        disabled={!codigoCuponInput || estadoCupon === "loading"}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg text-sm font-bold transition disabled:opacity-50"
                                    >
                                        {estadoCupon === "loading" ? "..." : "Aplicar"}
                                    </button>
                                </div>
                                {estadoCupon === "error" && (
                                    <p className="text-xs text-red-300 mt-1 flex items-center"><XCircle className="w-3 h-3 mr-1" /> {errorCuponMsg}</p>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-green-500/20 border border-green-400/50 p-2 rounded-lg">
                                <div className="flex items-center text-green-300 text-sm font-bold">
                                    <CheckCircle className="w-4 h-4 mr-2" /> {cuponAplicado.codigo}
                                </div>
                                <button type="button" onClick={quitarCupon} className="text-red-300 hover:text-red-100 text-xs underline">Quitar</button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 text-blue-100 text-sm">
                        <div className="flex justify-between"><span>Cant. Alumnos:</span><span className="font-bold">{alumnosWatch.length}</span></div>
                        <div className="flex justify-between"><span>Subtotal:</span><span>S/ {subTotalPagar.toFixed(2)}</span></div>

                        {cuponAplicado && (
                            <div className="flex justify-between text-green-300 font-bold border-t border-blue-500/50 pt-2">
                                <span>Descuento Cupón:</span>
                                <span>- S/ {cuponAplicado.monto.toFixed(2)}</span>
                            </div>
                        )}

                        {incentivo > 0 && (
                            <div className="flex items-center text-xs bg-blue-500/50 p-2 rounded-lg mt-2">
                                <Info className="w-4 h-4 mr-2" /> ¡Has ganado {incentivo} cupo(s) de cortesía!
                            </div>
                        )}
                    </div>

                    <div className="border-t border-blue-400 pt-4 flex justify-between items-end">
                        <span className="text-sm">Total a Pagar:</span>
                        <span className="text-3xl font-black">S/ {totalFinal.toFixed(2)}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || alumnosWatch.length === 0 || (!imagenVoucher && totalFinal > 0) || dnisDuplicados.length > 0} // BLOQUEO EXTRA
                        className="w-full bg-white text-blue-600 py-4 rounded-xl font-black text-lg hover:bg-blue-50 transition shadow-xl disabled:bg-blue-300"
                    >
                        {loading ? "Procesando..." : "Finalizar Inscripción"}
                    </button>
                </div>
            </div>
        </form>
    )
}