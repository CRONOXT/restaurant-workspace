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

  async create(data: Prisma.MesaCreateInput): Promise<Mesa> {
    return this.prisma.mesa.create({ data });
  }

  async findAll(sucursalId?: string): Promise<Mesa[]> {
    if (sucursalId) {
      return this.prisma.mesa.findMany({ 
        where: { sucursalId },
        include: { sucursal: true } 
      });
    }
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
    const mesa = await this.prisma.mesa.update({
      where: { id },
      data: { isOccupied: false },
      include: { sucursal: true }
    });
    this.eventsGateway.notifyTableFreed(mesa.sucursalId, mesa);
    return mesa;
  }

  async sendOrder(id: string, items: any[]): Promise<any> {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id },
      include: { sucursal: true }
    });
    if (!mesa) {
      throw new NotFoundException('Mesa no encontrada');
    }

    const orderData = {
      mesaId: mesa.id,
      numeroMesa: mesa.numero,
      items,
      timestamp: new Date()
    };

    // Emitir el evento de Nuevo Pedido a la sucursal correpondiente
    this.eventsGateway.notifyNewOrder(mesa.sucursalId, orderData);

    return {
      message: 'Pedido enviado correctamente',
      order: orderData
    };
  }

  async remove(id: string): Promise<Mesa> {
    return this.prisma.mesa.delete({ where: { id } });
  }
}
