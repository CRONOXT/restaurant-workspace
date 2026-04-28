import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Sucursal } from '@prisma/client';

@Injectable()
export class SucursalService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SucursalCreateInput): Promise<Sucursal> {
    // Si se especifica numeroMesas, creamos las mesas automáticamente en la BD
    const numeroMesas = Number(data.numeroMesas) || 0;
    
    if (numeroMesas > 0 && !data.mesas) {
      data.mesas = {
        create: Array.from({ length: numeroMesas }).map((_, index) => ({
          numero: index + 1,
          capacidad: 4 // Capacidad por defecto
        }))
      };
    }

    return this.prisma.sucursal.create({ data });
  }

  async findAll(empresaId?: string, search?: string, page = 1, limit = 10): Promise<{ data: Sucursal[], total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.SucursalWhereInput = {
      empresaId: empresaId || undefined,
      ...(search ? {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { direccion: { contains: search, mode: 'insensitive' } },
        ]
      } : {})
    };

    const [data, total] = await Promise.all([
      this.prisma.sucursal.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.sucursal.count({ where })
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Sucursal | null> {
    return this.prisma.sucursal.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.SucursalUpdateInput): Promise<Sucursal> {
    const sucursalActual = await this.prisma.sucursal.findUnique({
      where: { id },
      include: { _count: { select: { mesas: true } } }
    });

    const nuevoNumeroMesas = typeof data.numeroMesas === 'number' 
      ? data.numeroMesas 
      : (data.numeroMesas as any)?.set || 0;

    if (sucursalActual && nuevoNumeroMesas > sucursalActual._count.mesas) {
      const mesasFaltantes = nuevoNumeroMesas - sucursalActual._count.mesas;
      await this.prisma.mesa.createMany({
        data: Array.from({ length: mesasFaltantes }).map((_, index) => ({
          numero: sucursalActual._count.mesas + index + 1,
          capacidad: 4,
          sucursalId: id
        }))
      });
    }

    const { id: _, createdAt, updatedAt, mesas, menus, usuarios, ...cleanData } = data as any;

    return this.prisma.sucursal.update({ where: { id }, data: cleanData });
  }

  async remove(id: string): Promise<Sucursal> {
    return this.prisma.sucursal.delete({ where: { id } });
  }
}
