-- CreateEnum
CREATE TYPE "TipoColegio" AS ENUM ('ESTATAL', 'PARTICULAR', 'LIBRE');

-- AlterTable
ALTER TABLE "Estudiante" ADD COLUMN     "tipoColegio" "TipoColegio" NOT NULL DEFAULT 'ESTATAL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tipoColegio" "TipoColegio" NOT NULL DEFAULT 'ESTATAL';
