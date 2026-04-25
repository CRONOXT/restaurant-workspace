import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Sucursal } from '@prisma/client';

@Injectable()
export class SucursalService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.SucursalCreateInput): Promise<Sucursal> {
    return this.prisma.sucursal.create({ data });
  }

  async findAll(): Promise<Sucursal[]> {
    return this.prisma.sucursal.findMany();
  }

  async findOne(id: string): Promise<Sucursal | null> {
    return this.prisma.sucursal.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.SucursalUpdateInput): Promise<Sucursal> {
    return this.prisma.sucursal.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Sucursal> {
    return this.prisma.sucursal.delete({ where: { id } });
  }
}
