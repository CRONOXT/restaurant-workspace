import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Producto } from '@prisma/client';

@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProductoUncheckedCreateInput): Promise<Producto> {
    return this.prisma.producto.create({ data });
  }

  async update(id: string, data: Prisma.ProductoUpdateInput): Promise<Producto> {
    return this.prisma.producto.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Producto> {
    return this.prisma.producto.delete({ where: { id } });
  }
}
