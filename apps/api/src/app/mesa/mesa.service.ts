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

  async findAll(search?: string, page = 1, limit = 50, sucursalId?: string, empresaId?: string): Promise<{ data: Mesa[], total: number }> {
    const skip = (page - 1) * limit;
    const where: Prisma.MesaWhereInput = {
      sucursalId: sucursalId || undefined,
      sucursal: empresaId ? { empresaId } : undefined,
      ...(search ? {
        OR: [
          { numero: { equals: isNaN(Number(search)) ? undefined : Number(search) } }
        ]
      } : {})
    };

    const [data, total] = await Promise.all([
      this.prisma.mesa.findMany({
        where,
        skip,
        take: Number(limit),
        include: { sucursal: true, sesiones: { where: { isActive: true }, include: { comensales: true } } },
        orderBy: { numero: 'asc' }
      }),
      this.prisma.mesa.count({ where })
    ]);

    return { data, total };
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

    const wasCierreSolicitado = sesionActiva?.cierreSolicitado ?? false;

    if (sesionActiva) {
      await this.prisma.sesion.update({
        where: { id: sesionActiva.id },
        data: { isActive: false, closedAt: new Date(), cierreSolicitado: false }
      });
    }

    const mesa = await this.prisma.mesa.update({
      where: { id },
      data: { isOccupied: false },
      include: { sucursal: true }
    });

    this.eventsGateway.notifyTableFreed(mesa.sucursalId, mesa);

    // Si había solicitud de cierre pendiente, notificar al comensal que fue aprobado
    if (wasCierreSolicitado && sesionActiva) {
      this.eventsGateway.notifyCloseApproved(mesa.sucursalId, {
        sesionId: sesionActiva.id,
        mesaId: id,
        mesaNumero: mesa.numero,
      });
    }

    return mesa;
  }

  async remove(id: string): Promise<Mesa> {
    return this.prisma.mesa.delete({ where: { id } });
  }
}
