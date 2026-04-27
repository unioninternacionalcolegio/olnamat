"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, School, UserPlus, Users, CreditCard, Eye, LogOut, Settings } from "lucide-react"
import { signOut } from "next-auth/react"

export default function Sidebar({ userRole }: { userRole: string }) {
    const pathname = usePathname()

    // Menú basado en tu imagen, adaptado para que se muestre según el rol
    const menuItems = [
        { name: "Home", href: "/admin", icon: Home, roles: ["ADMINISTRADOR", "ASISTENTE", "DELEGADO", "LIBRE"] },
        { name: "Datos del Colegio", href: "/admin/colegio", icon: School, roles: ["DELEGADO", "REPRESENTANTE_IE"] },
        { name: "Inscripción Asesores", href: "/admin/asesores", icon: UserPlus, roles: ["ADMINISTRADOR", "DELEGADO"] },
        { name: "Inscripción Alumnos", href: "/admin/alumnos", icon: Users, roles: ["ADMINISTRADOR", "DELEGADO", "ASISTENTE", "LIBRE"] },
        { name: "Caja / Ventas Rápidas", href: "/admin/caja", icon: CreditCard, roles: ["ADMINISTRADOR", "ASISTENTE"] }, // Añadido para el cajero
        { name: "Mis Pagos", href: "/admin/mis-pagos", icon: CreditCard, roles: ["DELEGADO", "LIBRE"] },
        { name: "Ver Pagos", href: "/admin/ver-pagos", icon: Eye, roles: ["ADMINISTRADOR", "ASISTENTE"] },
        { name: "Subir Notas", href: "/admin/notas", icon: Users, roles: ["ADMINISTRADOR", "REVISADOR"] },
        { name: "Configurar Concurso", href: "/admin/configuracion", icon: Settings, roles: ["ADMINISTRADOR"] },
    ]

    const filteredMenu = menuItems.filter(item => item.roles.includes(userRole))

    return (
        <div className="w-64 bg-white border-r h-full flex flex-col shadow-sm">
            <div className="p-6 text-center border-b">
                <h1 className="text-xl font-bold text-gray-800 tracking-wider">OLNAMAT</h1>
                <p className="text-xs text-gray-500 capitalize mt-1 border border-gray-200 rounded-full px-2 py-1 inline-block">
                    {userRole.replace('_', ' ')}
                </p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {filteredMenu.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? "bg-red-50 text-red-600 font-medium"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? "text-red-500" : "text-gray-400"}`} />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    )
}