"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react" // <-- Agregamos getSession
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
    const router = useRouter()
    const [dni, setDni] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const res = await signIn("credentials", {
            redirect: false,
            dni,
            password,
        })

        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else {
            // MAGIA DE RUTEO: Obtenemos la sesión recién creada para ver el rol
            const session = await getSession()
            const userRole = session?.user?.role

            // Repartimos a los usuarios según su gafete
            if (userRole === "ADMINISTRADOR" || userRole === "ASISTENTE" || userRole === "REVISADOR") {
                router.push("/admin")
            } else if (userRole === "DELEGADO" || userRole === "REPRESENTANTE_IE") {
                router.push("/delegado") // Ojo: Asegúrate de que la carpeta se llame (dashboard)/delegado
            } else if (userRole === "LIBRE") {
                router.push("/libre") // <-- Así lo mandas a su propia casa
            } else {
                router.push("/") // Por si acaso hay un rol raro
            }

            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <div className="text-center flex flex-col items-center">
                    <div className="relative w-100 h-100"> {/* controla el tamaño */}
                        <Image
                            src="/logo.png"
                            alt="Logo OLNAMAT"
                            fill
                            className="object-contain"
                        />
                    </div>

                    <p className="-mt-18 text-sm text-gray-600">
                        Ingresa con tu DNI
                    </p>
                </div>
                <form className="-mt-6 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="dni" className="sr-only">DNI</label>
                            <input
                                id="dni"
                                name="dni"
                                type="text"
                                required
                                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Número de DNI"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Contraseña</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                        >
                            {loading ? "Ingresando..." : "Iniciar Sesión"}
                        </button>

                    </div>
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            ¿No tienes cuenta?{' '}
                            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                Regístrate aquí
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    )
}