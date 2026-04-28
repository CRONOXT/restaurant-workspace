import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Producto } from '@prisma/client';

@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProductoUncheckedCreateInput): Promise<Producto> {
    return this.prisma.producto.create({ data });
  }

  async findAll(categoriaId?: string, search?: string, page = 1, limit = 20): Promise<{ data: Producto[], total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.ProductoWhereInput = {
      categoriaId: categoriaId || undefined,
      OR: search ? [
        { nombre: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ] : undefined
    };

    const [data, total] = await Promise.all([
      this.prisma.producto.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { nombre: 'asc' }
      }),
      this.prisma.producto.count({ where })
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Producto | null> {
    return this.prisma.producto.findUnique({ where: { id } });
  }

  async update(id: string, data: any): Promise<Producto> {
    const { id: _, createdAt, updatedAt, categoria, ...cleanData } = data;
    return this.prisma.producto.update({ where: { id }, data: cleanData });
  }

  async remove(id: string): Promise<Producto> {
    return this.prisma.producto.delete({ where: { id } });
  }
}
