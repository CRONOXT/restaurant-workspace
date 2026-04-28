import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Menu } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.MenuCreateInput): Promise<Menu> {
    return this.prisma.menu.create({ data });
  }

  async findAll(empresaId?: string, search?: string, page = 1, limit = 10): Promise<{ data: Menu[], total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.MenuWhereInput = {
      sucursal: empresaId ? { empresaId } : undefined,
      ...(search ? {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { moneda: { contains: search, mode: 'insensitive' } },
        ]
      } : {})
    };

    const [data, total] = await Promise.all([
      this.prisma.menu.findMany({
        where,
        skip,
        take: Number(limit),
        include: { sucursal: true, categorias: true },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.menu.count({ where })
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Menu | null> {
    return this.prisma.menu.findUnique({
      where: { id },
      include: { sucursal: true, categorias: true }
    });
  }

  async update(id: string, data: any): Promise<Menu> {
    const { id: _, createdAt, updatedAt, categorias, sucursal, ...cleanData } = data;
    return this.prisma.menu.update({
      where: { id },
      data: cleanData,
    });
  }

  async remove(id: string): Promise<Menu> {
    return this.prisma.menu.delete({
      where: { id },
    });
  }
}
