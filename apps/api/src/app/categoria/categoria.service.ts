import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Categoria } from '@prisma/client';

@Injectable()
export class CategoriaService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CategoriaUncheckedCreateInput): Promise<Categoria> {
    return this.prisma.categoria.create({ data });
  }

  async findAllByMenu(menuId: string): Promise<Categoria[]> {
    return this.prisma.categoria.findMany({ 
      where: { menuId },
      include: { productos: true },
      orderBy: { orden: 'asc' }
    });
  }

  async update(id: string, data: any): Promise<Categoria> {
    // Limpiar campos que no deben enviarse en el update
    const { id: _, createdAt, updatedAt, productos, ...cleanData } = data;
    
    return this.prisma.categoria.update({ 
      where: { id }, 
      data: cleanData 
    });
  }

  async remove(id: string): Promise<Categoria> {
    return this.prisma.categoria.delete({ where: { id } });
  }
}
