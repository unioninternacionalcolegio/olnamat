"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Plus, Trash2, Calculator, Upload, Info, Image as ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import imageCompression from 'browser-image-compression'
// IMPORTAMOS EL COMPONENTE NUEVO
import ImportarExcel from "@/components/ImportarExcel"

export default function FormInscripcion({ precios }: { precios: any[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [imagenVoucher, setImagenVoucher] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const { register, control, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            alumnos: [{ nombres: "", apellidos: "", dni: "", nivel: "PRIMARIA", gradoOEdad: "1er Grado" }],
            metodo: "YAPE",
            numeroOperacion: ""
        }
    })

    const { fields, append, remove } = useFieldArray({ control, name: "alumnos" })
    const alumnosWatch = watch("alumnos")

    const totalPagar = alumnosWatch.reduce((acc, alum) => {
        const config = precios.find(p => p.nivel === alum.nivel && p.gradoOEdad === alum.gradoOEdad)
        return acc + (config ? config.costoRegular : 15)
    }, 0)

    const incentivo = Math.floor(alumnosWatch.length / 10)

    // FUNCIÓN PARA RECIBIR LOS DATOS DEL EXCEL
    const handleImportedData = (nuevosAlumnos: any[]) => {
        // setValue pisa lo que había y pone la nueva lista completa
        setValue("alumnos", nuevosAlumnos)
        alert(`Se importaron ${nuevosAlumnos.length} estudiantes correctamente.`)
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
            const options = {
                maxSizeMB: 0.2,
                maxWidthOrHeight: 1200,
                useWebWorker: true,
            }

            const compressedFile = await imageCompression(imagenVoucher, options)

            const formData = new FormData()
            formData.append("file", compressedFile, imagenVoucher.name)

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData
            })
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
            router.push("/delegado")
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

                    {/* BOTONES AGRUPADOS ARRIBA */}
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <ImportarExcel onDataImported={handleImportedData} />

                        <button
                            type="button"
                            onClick={() => append({ nombres: "", apellidos: "", dni: "", nivel: "PRIMARIA", gradoOEdad: "1er Grado" })}
                            className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 transition flex-1 sm:flex-none justify-center"
                        >
                            <Plus className="w-5 h-5" /> <span>Agregar Manual</span>
                        </button>
                    </div>
                </div>

                {/* TABLA DE CAMPOS (IGUAL QUE ANTES) */}
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 relative group">
                            <input {...register(`alumnos.${index}.dni`)} placeholder="DNI (Opcional)" className="p-2 border rounded-lg text-sm" />
                            <input {...register(`alumnos.${index}.nombres`)} placeholder="Nombres" className="p-2 border rounded-lg text-sm" required />
                            <input {...register(`alumnos.${index}.apellidos`)} placeholder="Apellidos" className="p-2 border rounded-lg text-sm" required />
                            <select {...register(`alumnos.${index}.nivel`)} className="p-2 border rounded-lg text-sm bg-white">
                                <option value="INICIAL">INICIAL</option>
                                <option value="PRIMARIA">PRIMARIA</option>
                                <option value="SECUNDARIA">SECUNDARIA</option>
                            </select>
                            <div className="flex items-center space-x-2">
                                <input {...register(`alumnos.${index}.gradoOEdad`)} placeholder="Grado/Edad" className="flex-1 p-2 border rounded-lg text-sm" required />
                                <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
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