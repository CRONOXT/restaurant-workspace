import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Menu } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.MenuCreateInput): Promise<Menu> {
    return this.prisma.menu.create({ data });
  }

  async findAll(): Promise<Menu[]> {
    return this.prisma.menu.findMany({
      include: { sucursal: true, categorias: true }
    });
  }

  async findOne(id: string): Promise<Menu | null> {
    return this.prisma.menu.findUnique({
      where: { id },
      include: { sucursal: true, categorias: true }
    });
  }

  async update(id: string, data: Prisma.MenuUpdateInput): Promise<Menu> {
    return this.prisma.menu.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Menu> {
    return this.prisma.menu.delete({
      where: { id },
    });
  }
}
