import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Mesa } from '@prisma/client';

@Injectable()
export class MesaService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.MesaCreateInput): Promise<Mesa> {
    return this.prisma.mesa.create({ data });
  }

  async findAll(): Promise<Mesa[]> {
    return this.prisma.mesa.findMany({ include: { sucursal: true } });
  }

  async findOne(id: string): Promise<Mesa | null> {
    return this.prisma.mesa.findFirst({
      where: {
        OR: [
          { id },
          { qrCode: id }
        ]
      },
      include: { sucursal: true }
    });
  }

  async update(id: string, data: Prisma.MesaUpdateInput): Promise<Mesa> {
    return this.prisma.mesa.update({ where: { id }, data });
  }

  async remove(id: string): Promise<Mesa> {
    return this.prisma.mesa.delete({ where: { id } });
  }
}
