"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    Users,
    UserPlus,
    CreditCard,
    Eye,
    Settings,
    LayoutDashboard,
    ClipboardList,
    School,
    LogOut // <-- AQUÍ ESTÁ EL ÍCONO QUE FALTABA
} from "lucide-react"
import { signOut } from "next-auth/react"

export default function Sidebar({ userRole }: { userRole: string }) {
    const pathname = usePathname()

    const menuItems = [
        // --- RUTAS DE ADMINISTRACIÓN Y STAFF ---
        {
            name: "Inicio Admin",
            href: "/admin",
            icon: Home,
            roles: ["ADMINISTRADOR", "ASISTENTE"]
        },
        {
            name: "Lista Alumnos",
            href: "/admin/alumnos",
            icon: Users,
            roles: ["ADMINISTRADOR", "ASISTENTE"]
        },
        {
            name: "Validar Pagos",
            href: "/admin/ver-pagos",
            icon: Eye,
            roles: ["ADMINISTRADOR", "ASISTENTE"]
        },
        {
            name: "Caja / Ventas",
            href: "/admin/caja",
            icon: CreditCard,
            roles: ["ADMINISTRADOR", "ASISTENTE"]
        },
        {
            name: "Subir Notas",
            href: "/admin/notas",
            icon: ClipboardList,
            roles: ["ADMINISTRADOR", "REVISADOR"]
        },
        {
            name: "Configuración",
            href: "/admin/configuracion",
            icon: Settings,
            roles: ["ADMINISTRADOR"]
        },

        // --- RUTAS DE DELEGADOS Y REPRESENTANTES ---
        {
            name: "Mi Panel",
            href: "/delegado",
            icon: LayoutDashboard,
            roles: ["DELEGADO", "REPRESENTANTE_IE", "LIBRE"]
        },
        {
            name: "Inscribir Alumnos",
            href: "/delegado/inscribir",
            icon: UserPlus,
            roles: ["DELEGADO", "REPRESENTANTE_IE"]
        },
        {
            name: "Mis Pagos",
            href: "/delegado/mis-pagos",
            icon: CreditCard,
            roles: ["DELEGADO", "REPRESENTANTE_IE", "LIBRE"]
        },
        // Estas rutas están comentadas o listas para el futuro cuando crees las carpetas
        /*
        {
            name: "Datos Colegio",
            href: "/delegado/colegio",
            icon: School,
            roles: ["DELEGADO", "REPRESENTANTE_IE"]
        },
        {
            name: "Asesores",
            href: "/delegado/asesores",
            icon: Users,
            roles: ["DELEGADO", "REPRESENTANTE_IE"]
        },
        */
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