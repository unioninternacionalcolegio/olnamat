"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Plus, Trash2, Calculator, Upload, Info, Image as ImageIcon, Clock, Building2, Ticket } from "lucide-react"
import { useRouter } from "next/navigation"
import imageCompression from 'browser-image-compression'
import ImportarExcel from "@/components/ImportarExcel"

// MAPA DE GRADOS INTELIGENTE
const OPCIONES_GRADOS = {
    INICIAL: ["3 años", "4 años", "5 años"],
    PRIMARIA: ["1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado"],
    SECUNDARIA: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"]
}

export default function FormInscripcion({ precios, userInstitucion = "Independiente" }: { precios: any[], userInstitucion?: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [imagenVoucher, setImagenVoucher] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const { register, control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            alumnos: [{
                nombres: "",
                apellidos: "",
                dni: "",
                nivel: "PRIMARIA",
                gradoOEdad: "1er Grado",
                tipoColegio: "ESTATAL", // <-- NUEVO: Para saber qué tarifa cobrar
                institucion: userInstitucion
            }],
            metodo: "YAPE",
            numeroOperacion: ""
        }
    })

    const { fields, append, remove } = useFieldArray({ control, name: "alumnos" })
    const alumnosWatch = watch("alumnos")

    // CALCULADORA MAESTRA: Suma según el grado Y el tipo de colegio
    const totalPagar = alumnosWatch.reduce((acc, alum) => {
        const config = precios.find(p => p.nivel === alum.nivel && p.gradoOEdad === alum.gradoOEdad)
        if (!config) return acc + 15; // Precio por defecto si hay error

        let costo = config.costoEstatalReg;
        if (alum.tipoColegio === 'PARTICULAR') costo = config.costoParticularReg;
        if (alum.tipoColegio === 'LIBRE') costo = config.costoLibreReg;

        return acc + costo;
    }, 0)

    const incentivo = Math.floor(alumnosWatch.length / 10)

    const handleImportedData = (nuevosAlumnos: any[]) => {
        const alumnosConColegio = nuevosAlumnos.map(alum => ({
            ...alum,
            tipoColegio: alum.tipoColegio || "ESTATAL", // Por defecto estatal si viene de excel
            institucion: alum.institucion || userInstitucion
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

    const onSubmit = async (data: any) => {
        if (!imagenVoucher) return alert("Por favor, sube la foto de tu voucher de pago.")

        setLoading(true)
        try {
            const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true }
            const compressedFile = await imageCompression(imagenVoucher, options)

            const formData = new FormData()
            formData.append("file", compressedFile, imagenVoucher.name)

            const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
            const uploadData = await uploadRes.json()

            if (!uploadRes.ok) throw new Error(uploadData.error || "Error subiendo imagen")

            const res = await fetch("/api/delegado/inscripcion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    alumnos: data.alumnos,
                    pagoInfo: {
                        montoTotal: totalPagar,
                        metodo: data.metodo,
                        numeroOperacion: data.numeroOperacion,
                        comprobanteUrl: uploadData.url
                    }
                })
            })

            if (!res.ok) throw new Error("Error al inscribir en la base de datos")

            alert("¡Inscripción y voucher enviados con éxito! Espere la validación.")
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
                    <h2 className="text-xl font-bold text-gray-800">Lista de Estudiantes</h2>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <ImportarExcel onDataImported={handleImportedData} />
                        <button
                            type="button"
                            onClick={() => append({ nombres: "", apellidos: "", dni: "", nivel: "PRIMARIA", gradoOEdad: "1er Grado", tipoColegio: "ESTATAL", institucion: userInstitucion })}
                            className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition flex-1 sm:flex-none justify-center"
                        >
                            <Plus className="w-5 h-5" /> <span>Agregar Manual</span>
                        </button>
                    </div>
                </div>

                {/* NUEVO DISEÑO: TARJETAS DE ESTUDIANTES */}
                <div className="space-y-6">
                    {fields.map((field, index) => {
                        const nivelActual = alumnosWatch[index]?.nivel as keyof typeof OPCIONES_GRADOS || "PRIMARIA";
                        const gradoActual = alumnosWatch[index]?.gradoOEdad || "1er Grado";
                        const tipoColegioActual = alumnosWatch[index]?.tipoColegio || "ESTATAL";

                        // Buscamos la configuración de ESTE alumno para mostrarle su turno y precio
                        const configAlumno = precios.find(p => p.nivel === nivelActual && p.gradoOEdad === gradoActual);

                        let costoAlumno = 0;
                        if (configAlumno) {
                            if (tipoColegioActual === 'ESTATAL') costoAlumno = configAlumno.costoEstatalReg;
                            if (tipoColegioActual === 'PARTICULAR') costoAlumno = configAlumno.costoParticularReg;
                            if (tipoColegioActual === 'LIBRE') costoAlumno = configAlumno.costoLibreReg;
                        }

                        return (
                            <div key={field.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 relative shadow-sm hover:shadow-md transition-shadow">

                                {/* Botón Borrar (Flotante) */}
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="absolute -top-3 -right-3 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-full transition-colors shadow-sm"
                                    title="Eliminar Alumno"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Fila 1: Datos Personales */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">DNI</label>
                                        <input {...register(`alumnos.${index}.dni`)} placeholder="Opcional" className="w-full p-2.5 border rounded-lg text-sm bg-white" />
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

                                {/* Fila 2: Concurso y Colegio */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nivel / Grado</label>
                                        <div className="flex space-x-2">
                                            <select {...register(`alumnos.${index}.nivel`)} className="w-1/2 p-2.5 border rounded-lg text-sm bg-white font-bold text-blue-700">
                                                <option value="INICIAL">INICIAL</option>
                                                <option value="PRIMARIA">PRIMARIA</option>
                                                <option value="SECUNDARIA">SECUNDARIA</option>
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
                                            <select {...register(`alumnos.${index}.tipoColegio`)} className="w-full p-2.5 border rounded-lg text-sm bg-white">
                                                <option value="ESTATAL">Estatal Nacional</option>
                                                <option value="PARTICULAR">Particular Privado</option>
                                                <option value="LIBRE">Alumno Libre</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nombre Institución</label>
                                            <div className="flex items-center">
                                                <Building2 className="w-4 h-4 text-gray-400 absolute ml-3" />
                                                <input {...register(`alumnos.${index}.institucion`)} placeholder="Institución Educativa" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm bg-white uppercase" required />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fila 3: Info Automática (Turno y Precio) */}
                                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-lg border border-blue-100 text-sm">
                                    <div className="flex items-center text-blue-800 font-medium mb-2 sm:mb-0">
                                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                        {configAlumno ? (
                                            <span><strong>{configAlumno.turno}</strong> ({configAlumno.horaInicio} - {configAlumno.horaFin})</span>
                                        ) : (
                                            <span className="text-red-500 italic">Configuración no encontrada para este grado</span>
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
                                <input {...register("numeroOperacion")} required placeholder="Ej: 054879" className="w-full p-3 border rounded-xl bg-gray-50 mt-1" />
                            </div>
                        </div>

                        {/* ZONA DE SUBIDA DE IMAGEN */}
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
                            {previewUrl && <p className="text-[10px] text-green-600 mt-1 font-bold text-right">Imagen lista para comprimir</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white space-y-6">
                    <h3 className="font-bold flex items-center text-lg"><Calculator className="w-6 h-6 mr-2" /> Resumen</h3>
                    <div className="space-y-2 text-blue-100">
                        <div className="flex justify-between"><span>Cant. Alumnos:</span><span className="font-bold">{alumnosWatch.length}</span></div>
                        {incentivo > 0 && (
                            <div className="flex items-center text-xs bg-blue-500/50 p-2 rounded-lg">
                                <Info className="w-4 h-4 mr-2" /> ¡Has ganado {incentivo} cupo(s) de cortesía!
                            </div>
                        )}
                    </div>
                    <div className="border-t border-blue-400 pt-4 flex justify-between items-end">
                        <span className="text-sm">Total Estimado:</span>
                        <span className="text-3xl font-black">S/ {totalPagar.toFixed(2)}</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || alumnosWatch.length === 0 || !imagenVoucher}
                        className="w-full bg-white text-blue-600 py-4 rounded-xl font-black text-lg hover:bg-blue-50 transition shadow-xl disabled:bg-blue-300"
                    >
                        {loading ? "Procesando..." : "Finalizar Inscripción"}
                    </button>
                </div>
            </div>
        </form>
    )
}