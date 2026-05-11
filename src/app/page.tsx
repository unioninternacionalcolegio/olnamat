"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, MapPin, Calendar, Trophy } from "lucide-react"

export default function Home() {
  const [mostrarCuentas, setMostrarCuentas] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Countdown
  useEffect(() => {
    const targetDate = new Date("2026-06-13T09:00:00").getTime()

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      } else {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 10
      const bodyRect = document.body.getBoundingClientRect().top
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition - bodyRect - offset

      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden font-sans">
      {/* NAVBAR */}
      <nav className="bg-white/95 backdrop-blur-lg border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo PNG */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 group">
              <img
                src="/logo.png"
                alt="OLNAMAT Logo"
                className="w-full h-full object-contain drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-gray-900">OLNAMAT</h1>
              <p className="text-[10px] sm:text-xs text-gray-500 -mt-1 tracking-widest">OLIMPIADAS NACIONALES DE MATEMÁTICA</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-700">
            <button onClick={() => scrollToSection('bases')} className="hover:text-blue-700 transition-colors">Bases</button>
            <button onClick={() => scrollToSection('temario')} className="hover:text-blue-700 transition-colors">Temario</button>
            <button onClick={() => scrollToSection('precios')} className="hover:text-blue-700 transition-colors">Precios</button>
            <button onClick={() => scrollToSection('inscripciones')} className="hover:text-blue-700 transition-colors">Inscribirse</button>
            <button onClick={() => scrollToSection('contacto')} className="hover:text-blue-700 transition-colors">Contacto</button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMostrarCuentas(true)}
              className="hidden sm:block px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
            >
              Ver Cuentas
            </button>

            <Link
              href="/register"
              className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-blue-500/30 active:scale-95 text-sm sm:text-base"
            >
              Inscribirse Libre
            </Link>
            <Link
              href="/login"
              className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-blue-500/30 active:scale-95 text-sm sm:text-base"
            >
              Ingresar
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white py-6 px-6">
            <div className="flex flex-col gap-6 text-lg font-medium text-gray-700">
              <button onClick={() => scrollToSection('bases')} className="text-left">Bases</button>
              <button onClick={() => scrollToSection('temario')} className="text-left">Temario</button>
              <button onClick={() => scrollToSection('precios')} className="text-left">Precios</button>
              <button onClick={() => scrollToSection('inscripciones')} className="text-left">Inscribirse</button>
              <button onClick={() => scrollToSection('contacto')} className="text-left">Contacto</button>
              <button onClick={() => setMostrarCuentas(true)} className="text-left">Ver Cuentas de Pago</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO - Muy responsive */}
      <section className="relative min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-blue-900 text-white overflow-hidden pt-16">
        {/* Background Math Symbols */}
        <div className="absolute inset-0 opacity-900 pointer-events-none">
          <div className="absolute top-20 left-6 text-[140px] sm:text-[180px] font-black text-white/10">∑</div>
          <div className="absolute bottom-32 right-6 text-[200px] sm:text-[260px] font-black text-white/10 -rotate-12">∫</div>
          <div className="absolute top-1/3 right-1/4 text-[120px] sm:text-[160px] font-black text-white/10">π</div>
        </div>

        {/* Trofeo */}
        <div className="absolute top-1/4 right-4 md:right-12 lg:right-24 hidden lg:block">
          <img
            src="/trofeo/trofeo-principal.png"
            alt="Trofeo"
            className="w-40 sm:w-52 drop-shadow-2xl animate-[float_12s_ease-in-out_infinite]"
          />
        </div>

        <div className="max-w-5xl mx-auto text-center px-5 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-2.5 rounded-full mb-6 border border-white/20">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="uppercase tracking-widest font-bold text-emerald-300 text-sm">Edición 2026 • Huancayo</span>
          </div>

          {/* Logo Grande en el Hero */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo.png"
              alt="OLNAMAT Logo"
              className="w-[280px] sm:w-[360px] md:w-[460px] lg:w-[540px] xl:w-[620px] drop-shadow-2xl transition-all duration-700 hover:scale-105"
            />
          </div>

          <p className="text-[28px] sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-[-0.02em] text-blue-100 max-w-4xl mx-auto mb-12 text-center leading-none">
            Desafía tu mente.<br className="hidden sm:block" />
            <span className="font-semibold text-white">Demuestra tu talento.</span>
          </p>

          {/* Countdown */}
          <div className="flex justify-center gap-3 sm:gap-4 mb-12 flex-wrap">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="bg-white/10 backdrop-blur-md rounded-2xl px-5 sm:px-6 py-3 sm:py-4 min-w-[78px] border border-white/20">
                <div className="text-3xl sm:text-4xl font-black tabular-nums">{value}</div>
                <div className="text-xs uppercase tracking-widest text-blue-200">{unit}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollToSection('inscripciones')}
              className="group px-10 sm:px-12 py-5 sm:py-6 bg-white text-blue-950 font-black text-lg sm:text-xl rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/30 flex items-center justify-center gap-3"
            >
              INSCRIBIRME AHORA
              <span className="group-hover:rotate-12 transition-transform">→</span>
            </button>

            <button
              onClick={() => scrollToSection('temario')}
              className="px-10 sm:px-12 py-5 sm:py-6 border-2 border-white/70 hover:bg-white/10 font-semibold text-lg sm:text-xl rounded-3xl transition-all"
            >
              CUADRO DE PREGUNTAS
            </button>
          </div>

          <p className="mt-12 text-sm sm:text-base text-blue-200">
            Huancayo, Junín • 13 de Junio 2026
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/60 rounded-full flex items-center justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full animate-scroll-down"></div>
          </div>
        </div>
      </section>

      {/* INFORMACIÓN RÁPIDA */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight mb-4">Información General</h2>
            <p className="text-gray-600 text-lg">OLNAMAT Edición 2026</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Lugar */}
            <div className="group bg-white border border-gray-100 hover:border-indigo-200 rounded-3xl p-10 text-center transition-all hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-6 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <MapPin className="w-9 h-9 text-indigo-600" />
              </div>
              <h3 className="font-bold text-2xl mb-3 text-gray-900">Lugar</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Colegio UNION INTERNACIONAL<br />
                Chilca, Huancayo, Junín
              </p>
            </div>

            {/* Fecha */}
            <div className="group bg-white border border-gray-100 hover:border-indigo-200 rounded-3xl p-10 text-center transition-all hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-6 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Calendar className="w-9 h-9 text-indigo-600" />
              </div>
              <h3 className="font-bold text-2xl mb-3 text-gray-900">Fecha</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Sábado 13 de Junio de 2026
              </p>
            </div>

            {/* Categorías */}
            <div className="group bg-white border border-gray-100 hover:border-indigo-200 rounded-3xl p-10 text-center transition-all hover:shadow-xl">
              <div className="w-16 h-16 mx-auto mb-6 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Trophy className="w-9 h-9 text-indigo-600" />
              </div>
              <h3 className="font-bold text-2xl mb-3 text-gray-900">Categorías</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Nivel Inicial<br />
                Primaria (1° a 6°)<br />
                Secundaria (1° a 5°)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TEMARIO */}
      <section id="temario" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block bg-indigo-100 text-indigo-700 text-sm font-bold px-6 py-2 rounded-full mb-4">OFICIAL 2026</div>
            <h2 className="text-5xl font-black mb-4 tracking-tight">Cuadro de Preguntas</h2>
            <p className="text-xl text-gray-600 max-w-md mx-auto">Contenidos diseñados para cada nivel educativo</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Inicial */}
            <div className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all group">
              <div className="uppercase text-amber-600 font-black tracking-widest text-sm mb-4">Nivel Inicial</div>
              <h3 className="text-4xl font-black mb-8">Pre-Escolar</h3>
              <ul className="space-y-5 text-lg text-gray-700">
                {["Raznomaniento Matematco 5", "Matematica 5"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><span className="text-2xl text-emerald-500 mt-[-4px]">•</span> {item}</li>
                ))}
              </ul>
              <h3 className="text-3xl font-black mb-8">Total : 10</h3>
            </div>

            {/* Primaria */}
            <div className="bg-white rounded-3xl p-10 shadow-2xl border-2 border-indigo-500 relative scale-[1.02] hover:scale-[1.04] transition-all">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold px-8 py-2 rounded-full">MÁS DEMANDADO</div>
              <div className="uppercase text-indigo-600 font-black tracking-widest text-sm mb-4">Nivel Primaria</div>
              <h3 className="text-4xl font-black mb-8">1° grado a 6° grado</h3>
              <ul className="space-y-5 text-lg text-gray-700">
                {["Raznomaniento Matematco 7", "Matematica 8"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><span className="text-2xl text-emerald-500 mt-[-4px]">•</span> {item}</li>
                ))}
              </ul>
              <h3 className="text-3xl font-black mb-8">Total : 15</h3>
            </div>

            {/* Secundaria */}
            <div className="bg-white rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all group">
              <div className="uppercase text-purple-600 font-black tracking-widest text-sm mb-4">Nivel Secundaria</div>
              <h3 className="text-4xl font-black mb-8">1° a 5°</h3>
              <ul className="space-y-5 text-lg text-gray-700">
                {["Raznomaniento Matematco 7", "Matematica 8"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3"><span className="text-2xl text-emerald-500 mt-[-4px]">•</span> {item}</li>
                ))}
              </ul>
              <h3 className="text-3xl font-black mb-8">Total : 15</h3>
            </div>
          </div>
        </div>
      </section>

      {/* CAMPEONES 2025 */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          {/* <div className="text-center mb-16">
            <div className="inline-block bg-amber-100 text-amber-700 text-sm font-bold px-6 py-2 rounded-full mb-4">
              EDICIÓN 2025
            </div>
            <h2 className="text-5xl font-black tracking-tight mb-4">Campeones del Año Pasado</h2>
            <p className="text-xl text-gray-600">Ellos ya lo lograron. ¿Serás el próximo?</p>
          </div>

          {/* Ganador Nato Destacado */}
          {/*<div className="relative mb-20 rounded-3xl overflow-hidden bg-gradient-to-br from-amber-900 to-yellow-900 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:40px_40px]"></div>

            <div className="grid md:grid-cols-2 gap-12 items-center p-12 lg:p-16">
              <div>
                <div className="uppercase tracking-widest text-amber-300 text-sm mb-3">Campeón Absoluto 2025</div>
                <h3 className="text-5xl font-black leading-none mb-6">Juan Diego Morales<br /> <span className="text-4xl">• 5° Secundaria</span></h3>
                <p className="text-2xl text-amber-200">Colegio San José - Huancayo</p>

                <div className="mt-10 flex gap-6">
                  <div className="bg-white/10 backdrop-blur rounded-2xl px-6 py-4">
                    <div className="text-3xl font-black">1°</div>
                    <div className="text-sm">Lugar Nacional</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <img
                  src="/ganadores/ganador-nato.png"
                  alt="Ganador Nato OLNAMAT 2025"
                  className="drop-shadow-2xl max-h-[420px] object-contain"
                />
              </div>
            </div>
          </div>

          {/* Medallas */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              { puesto: "1°", nombre: "Medalla de Oro", img: "/premios/medalla-oro.png", color: "amber" },
              { puesto: "2°", nombre: "Medalla de Plata", img: "/premios/medalla-plata.png", color: "zinc" },
              { puesto: "3°", nombre: "Medalla de Bronce", img: "/premios/medalla-bronce.png", color: "orange" },
            ].map((medal) => (
              <div key={medal.puesto} className="text-center group">
                <div className="h-52 flex items-center justify-center mb-6">
                  <img
                    src={medal.img}
                    alt={medal.nombre}
                    className="h-52 drop-shadow-xl group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h4 className="font-black text-3xl mb-1">{medal.puesto}</h4>
                <p className="text-gray-600">{medal.nombre}</p>
              </div>
            ))}
          </div>

          {/* Colegios Participantes */}
          <div>
            <h3 className="text-center text-2xl font-bold mb-10 text-gray-800">Colegios Participantes 2025</h3>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-75 grayscale hover:grayscale-0 transition-all">
              <img src="/colegios/san-jose.png" alt="Colegio San José" className="h-16" />
              <img src="/colegios/san-jose.png" alt="Colegio San José" className="h-16" />
              <img src="/colegios/san-jose.png" alt="Colegio San José" className="h-16" />
              <img src="/colegios/san-jose.png" alt="Colegio San José" className="h-16" />
              {/* Agrega más logos aquí */}
              <img src="/colegios/otro-colegio.png" alt="Otro Colegio" className="h-16" />
            </div>
          </div>
        </div>
      </section>
      {/* PRECIOS */}
      <section id="precios" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4">PRECIOS DE INSCRIPCIÓN</h2>
            <p className="text-xl text-gray-600">Se Habilita Plataforma e historial de puntaje</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { nivel: "Inicial", precio: "15", color: "emerald", popular: false },
              { nivel: "Primaria", precio: "15", color: "indigo", popular: true },
              { nivel: "Secundaria", precio: "15", color: "purple", popular: false },
            ].map((item) => (
              <div key={item.nivel} className={`border-2 rounded-3xl p-10 text-center transition-all hover:-translate-y-3 ${item.popular ? 'border-indigo-600 shadow-2xl scale-105' : 'border-gray-100'}`}>
                {item.popular && (
                  <div className="bg-indigo-600 text-white text-sm font-bold py-1 px-8 rounded-full inline-block mb-6">RECOMENDADO</div>
                )}
                <h3 className="font-black text-3xl mb-2">{item.nivel}</h3>
                <div className={`text-7xl font-black text-${item.color}-600 mb-2`}>S/ {item.precio}</div>
                <p className="text-sm text-gray-500 mb-10">Hasta 12 de junio 2026</p>
                <div className="text-left space-y-3 text-sm mb-10">
                  <div>✓ Libre S/.15.00</div>
                  <div>✓ Intucion Ed Particular S/.15.00</div>
                  <div>✓ Intucion Ed Estatal S/.13.00</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSCRIPCIONES */}
      {/* INSCRIPCIONES */}
      <section id="inscripciones" className="py-24 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-black mb-6">Elige tu modalidad</h2>
          <p className="text-2xl text-gray-600 max-w-xl mx-auto mb-16">
            Dos formas fáciles de participar
          </p>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Alumno Libre */}
            <div className="bg-white rounded-3xl p-12 shadow-xl hover:shadow-2xl transition-all group border border-transparent hover:border-orange-100">
              <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">👤</span>
              </div>
              <h3 className="text-4xl font-black mb-6">Alumno Libre</h3>
              <p className="text-gray-600 text-lg mb-12 leading-relaxed">
                Inscríbete de forma individual. Ideal para estudiantes que no participan a través de su colegio.
              </p>
              <Link
                href="/register"
                className="block w-full py-7 bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-white font-black text-xl rounded-3xl transition-all active:scale-[0.98] shadow-lg"
              >
                INSCRIBIRME COMO LIBRE
              </Link>
            </div>

            {/* Institución Educativa */}
            <div className="bg-white rounded-3xl p-12 shadow-xl hover:shadow-2xl transition-all group border border-transparent hover:border-emerald-100">
              <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">🏛️</span>
              </div>
              <h3 className="text-4xl font-black mb-6">Institución Educativa</h3>
              <p className="text-gray-600 text-lg mb-12 leading-relaxed">
                Los colegios deben inscribirse mediante un Delegado Oficial.
              </p>
              <button
                onClick={() => window.open("https://wa.me/51925904377", "_blank")}
                className="block w-full py-7 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xl rounded-3xl transition-all active:scale-[0.98] shadow-lg"
              >
                CONTACTAR COMO DELEGADO
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BASES */}
      <section id="bases" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl font-black text-center mb-6">Bases del Concurso</h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Descarga las bases oficiales completas
          </p>

          <div className="flex flex-col items-center gap-8">
            {/* Vista Previa del PDF */}
            <div className="w-full max-w-3xl border border-gray-200 rounded-3xl overflow-hidden shadow-xl">
              <iframe
                src="/bases/OLNAMAT-Bases-2026.pdf"
                className="w-full h-[600px] md:h-[720px]"
                title="Bases OLNAMAT 2026"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/bases/OLNAMAT-Bases-2026.pdf"
                target="_blank"
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl flex items-center gap-3 transition-all"
              >
                📄 Ver Bases en Nueva Pestaña
              </a>

              <a
                href="/bases/OLNAMAT-Bases-2026.pdf"
                download="Bases-OLNAMAT-2026.pdf"
                className="px-8 py-4 bg-white border-2 border-indigo-600 text-indigo-600 font-semibold rounded-2xl flex items-center gap-3 hover:bg-indigo-50 transition-all"
              >
                ⬇️ Descargar PDF
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-24 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-8">¿Tienes dudas?</h2>
          <p className="text-2xl text-gray-400 mb-12">Estamos aquí para ayudarte</p>

          <div className="flex flex-wrap justify-center gap-6">
            <a href="https://wa.me/51925904377" target="_blank" className="bg-green-500 hover:bg-green-600 px-10 py-6 rounded-3xl font-semibold text-xl flex items-center gap-4 transition-all active:scale-95">
              📲 WhatsApp - Delegados
            </a>
            <a href="https://wa.me/51956369592" target="_blank" className="bg-green-500 hover:bg-green-600 px-10 py-6 rounded-3xl font-semibold text-xl flex items-center gap-4 transition-all active:scale-95">
              📲 Información General
            </a>
          </div>

          <p className="mt-16 text-gray-500">Organizado por <span className="text-white font-medium">Unión Internacional SAC</span></p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-gray-400 py-20 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-8 mb-8 text-sm">
            <span>© 2026 OLNAMAT</span>
            <span>Todos los derechos reservados</span>
          </div>
          <p className="text-sm">Hecho con pasión para impulsar el talento matemático del Perú</p>
        </div>
        {/* En Información Rápida */}
        <div className="flex justify-center mt-12">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">Colegio Auspiciador</p>
            <img src="/colegios/union-internacional.png" alt="Colegio UNION INTERNACIONAL CHILCA HUANCAYO" className="h-20 mx-auto" />
          </div>
        </div>
      </footer>

      {/* Modal Cuentas */}
      {mostrarCuentas && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-10 relative">
            <button
              onClick={() => setMostrarCuentas(false)}
              className="absolute top-6 right-6 text-4xl text-gray-400 hover:text-black"
            >
              ✕
            </button>
            <h3 className="text-3xl font-black text-center mb-10">Métodos de Pago</h3>

            <div className="aspect-video bg-gray-100 rounded-2xl mb-10 flex items-center justify-center border border-dashed border-gray-300 overflow-hidden">
              <div className="text-center">
                <p className="font-medium text-gray-500">QR YAPE / PLIN</p>
                <p className="text-xs text-gray-400 mt-2">Reemplaza esta zona con tu imagen real (/public/cuentas-pago.jpg)</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <p className="font-bold text-emerald-600 mb-1">YAPE / PLIN</p>
                <p className="font-mono text-3xl tracking-wider">925 904 377</p>
                <p className="text-center text-sm text-gray-500 mt-1">A nombre de: Riveros Conozco Josué</p>
              </div>
              <div>
                <p className="font-bold text-blue-600 mb-1">BCP Soles</p>
                <p className="font-mono text-2xl">355-07706069-0-44</p>
              </div>
              <div>
                <p className="font-bold mb-1">CCI BCP Soles</p>
                <p className="font-mono text-2xl">002-35510770606904460</p>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-10">A nombre de: Riveros Conozco Josué</p>
          </div>
        </div>
      )}
    </div>
  )
}