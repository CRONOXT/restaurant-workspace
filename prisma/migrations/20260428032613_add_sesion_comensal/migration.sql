-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "comensalId" TEXT,
ADD COLUMN     "esCompartido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sesionId" TEXT;

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comensal" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "esLider" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comensal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sesion_codigo_key" ON "Sesion"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Comensal_token_key" ON "Comensal"("token");

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Mesa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comensal" ADD CONSTRAINT "Comensal_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "Sesion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "Sesion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_comensalId_fkey" FOREIGN KEY ("comensalId") REFERENCES "Comensal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
