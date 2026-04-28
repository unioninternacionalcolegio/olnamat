-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'ASISTENTE', 'REVISADOR', 'LIBRE', 'DELEGADO', 'REPRESENTANTE_IE');

-- CreateEnum
CREATE TYPE "Nivel" AS ENUM ('INICIAL', 'PRIMARIA', 'SECUNDARIA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('YAPE', 'PLIN', 'TRANSFERENCIA', 'EFECTIVO');

-- CreateEnum
CREATE TYPE "EstadoRegistro" AS ENUM ('INCOMPLETO', 'COMPLETO');

-- CreateEnum
CREATE TYPE "TipoComprobante" AS ENUM ('TICKET_INTERNO', 'BOLETA', 'FACTURA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'LIBRE',
    "dni" TEXT,
    "celular" TEXT,
    "institucion" TEXT,
    "localidad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "tipoComprobante" "TipoComprobante" NOT NULL DEFAULT 'TICKET_INTERNO',
    "serie" TEXT NOT NULL DEFAULT 'T001',
    "correlativo" SERIAL NOT NULL,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "numeroOperacion" TEXT,
    "fechaHoraPago" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "comprobanteUrl" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'APROBADO',
    "clienteId" TEXT NOT NULL,
    "cajeroId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estudiante" (
    "id" TEXT NOT NULL,
    "dni" TEXT,
    "nombres" TEXT,
    "apellidos" TEXT,
    "nivel" "Nivel" NOT NULL,
    "gradoOEdad" TEXT NOT NULL,
    "institucion" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "estadoRegistro" "EstadoRegistro" NOT NULL DEFAULT 'COMPLETO',
    "creadorId" TEXT NOT NULL,
    "pagoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoExamen" (
    "id" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "correctas" INTEGER NOT NULL DEFAULT 0,
    "incorrectas" INTEGER NOT NULL DEFAULT 0,
    "enBlanco" INTEGER NOT NULL DEFAULT 0,
    "puntajeTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horaSalida" TIMESTAMP(3),
    "revisadorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultadoExamen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionConcurso" (
    "id" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "gradoOEdad" TEXT NOT NULL,
    "turno" TEXT NOT NULL DEFAULT 'Turno 1',
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "costoEstatalReg" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "costoEstatalExt" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "costoParticularReg" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "costoParticularExt" DOUBLE PRECISION NOT NULL DEFAULT 17,
    "costoLibreReg" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "costoLibreExt" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "cantidadPreguntas" INTEGER NOT NULL,
    "puntosCorrecto" DOUBLE PRECISION NOT NULL,
    "puntosIncorrecto" DOUBLE PRECISION NOT NULL,
    "puntosBlanco" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionConcurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_serie_correlativo_key" ON "Pago"("serie", "correlativo");

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_dni_key" ON "Estudiante"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoExamen_estudianteId_key" ON "ResultadoExamen"("estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionConcurso_nivel_gradoOEdad_turno_key" ON "ConfiguracionConcurso"("nivel", "gradoOEdad", "turno");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cajeroId_fkey" FOREIGN KEY ("cajeroId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoExamen" ADD CONSTRAINT "ResultadoExamen_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
