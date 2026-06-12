// middleware.ts
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const isAuth = !!token;
    const pathname = req.nextUrl.pathname;
    const userRole = token?.role as string;

    // 1. Si no está logueado y quiere entrar a algo que no sea login/register
    if (!isAuth && !pathname.startsWith("/login") && !pathname.startsWith("/register")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // 2. PROTECCIÓN POR ROL (Aquí es donde está la magia)
    // Si intenta entrar a /admin y no es ADMINISTRADOR o ASISTENTE...
    if (pathname.startsWith("/admin")) {
      if (userRole !== "ADMINISTRADOR" && userRole !== "ASISTENTE" && userRole !== "REVISADOR") {
        return NextResponse.redirect(new URL("/delegado", req.url)); // Lo enviamos a su panel
      }
    }

    // 3. BLOQUEO ESPECÍFICO PARA ADMINS (como /admin/pruebas)
    if (pathname.startsWith("/admin/pruebas") && userRole !== "ADMINISTRADOR") {
        return NextResponse.redirect(new URL("/admin", req.url)); // Solo admin entra ahí
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // El manejo lo hacemos arriba
    },
  }
);

// Definimos qué rutas queremos proteger
export const config = {
  matcher: ["/admin/:path*", "/delegado/:path*", "/libre/:path*"],
};