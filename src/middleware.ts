// src/middleware.ts
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const pathname = req.nextUrl.pathname;
    
    // El rol viene como string desde el token
    const userRole = token?.role as string;

    // 1. Si no está logueado, redirigir al login
    if (!isAuth && !pathname.startsWith("/login") && !pathname.startsWith("/register")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // 2. Si está logueado, protegemos rutas según su ROL
    if (isAuth) {
      
      // Rutas que requieren ser ADMINISTRADOR
      const rutasAdminExclusivas = ["/admin/pruebas", "/admin/configuracion", "/admin/resumen-delegados"];
      if (rutasAdminExclusivas.some(ruta => pathname.startsWith(ruta))) {
        if (userRole !== "ADMINISTRADOR") {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }

      // Rutas generales de ADMIN (Accesibles por admin, asistente, revisador)
      if (pathname.startsWith("/admin")) {
        const rolesAutorizadosAdmin = ["ADMINISTRADOR", "ASISTENTE", "REVISADOR"];
        if (!rolesAutorizadosAdmin.includes(userRole)) {
          return NextResponse.redirect(new URL("/delegado", req.url));
        }
      }

      // Rutas de DELEGADO (Accesibles por delegado, representante, libre)
      if (pathname.startsWith("/delegado")) {
        const rolesAutorizadosDelegado = ["DELEGADO", "REPRESENTANTE_IE", "LIBRE"];
        if (!rolesAutorizadosDelegado.includes(userRole)) {
          return NextResponse.redirect(new URL("/admin", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

// Definimos qué rutas deben pasar por este filtro
export const config = {
  matcher: ["/admin/:path*", "/delegado/:path*", "/libre/:path*"],
};