/*
  Warnings:

  - You are about to drop the column `empresaId` on the `Sucursal` table. All the data in the column will be lost.
  - You are about to drop the column `empresaId` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the `Empresa` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Sucursal" DROP CONSTRAINT "Sucursal_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_empresaId_fkey";

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "moneda" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Sucursal" DROP COLUMN "empresaId",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "numeroMesas" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "empresaId";

-- DropTable
DROP TABLE "Empresa";
