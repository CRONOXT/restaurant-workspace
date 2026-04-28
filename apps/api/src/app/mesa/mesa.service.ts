import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Mesa } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class MesaService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway
  ) {}

  private mesaIncludes() {
    return {
      sucursal: true,
      pedidos: {
        where: { estado: { not: 'ENTREGADO' as const } },
        orderBy: { createdAt: 'desc' as const },
        include: { comensal: true }
      },
      sesiones: {
        where: { isActive: true },
        include: { comensales: true },
        take: 1
      }
    };
  }

  async create(data: Prisma.MesaCreateInput): Promise<Mesa> {
    return this.prisma.mesa.create({ data });
  }

  async findAll(sucursalId?: string) {
    const includes = this.mesaIncludes();
    if (sucursalId) {
      return this.prisma.mesa.findMany({
        where: { sucursalId },
        include: includes
      });
    }
    return this.prisma.mesa.findMany({ include: includes });
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
    const mesa = await this.prisma.mesa.update({ where: { id }, data });
    return mesa;
  }

  async occupy(id: string): Promise<Mesa> {
    const mesa = await this.prisma.mesa.update({
      where: { id },
      data: { isOccupied: true },
      include: { sucursal: true }
    });
    this.eventsGateway.notifyTableOccupied(mesa.sucursalId, mesa);
    return mesa;
  }

  async free(id: string): Promise<Mesa> {
    // Cerrar sesión activa si existe
    const sesionActiva = await this.prisma.sesion.findFirst({
      where: { mesaId: id, isActive: true }
    });

    if (sesionActiva) {
      await this.prisma.sesion.update({
        where: { id: sesionActiva.id },
        data: { isActive: false, closedAt: new Date() }
      });
    }

    const mesa = await this.prisma.mesa.update({
      where: { id },
      data: { isOccupied: false },
      include: { sucursal: true }
    });
    this.eventsGateway.notifyTableFreed(mesa.sucursalId, mesa);
    return mesa;
  }

  async remove(id: string): Promise<Mesa> {
    return this.prisma.mesa.delete({ where: { id } });
  }
}
