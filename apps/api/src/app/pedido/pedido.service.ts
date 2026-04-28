import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { EstadoPedido } from '@prisma/client';

@Injectable()
export class PedidoService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway
  ) {}

  async create(mesaId: string, items: any[], notas?: string) {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id: mesaId },
      include: { sucursal: true }
    });

    if (!mesa) {
      throw new NotFoundException('Mesa no encontrada');
    }

    const total = items.reduce((sum: number, item: any) => sum + (item.precio * item.cantidad), 0);

    const pedido = await this.prisma.pedido.create({
      data: {
        mesaId: mesa.id,
        items,
        total,
        notas,
        estado: EstadoPedido.PENDIENTE
      },
      include: { mesa: true }
    });

    // Emitir evento de nuevo pedido a la sucursal correspondiente
    this.eventsGateway.notifyNewOrder(mesa.sucursalId, {
      ...pedido,
      numeroMesa: mesa.numero,
      sucursalId: mesa.sucursalId
    });

    return pedido;
  }

  async findByMesa(mesaId: string, estado?: EstadoPedido) {
    const where: any = { mesaId };
    if (estado) {
      where.estado = estado;
    }
    return this.prisma.pedido.findMany({
      where,
      include: { mesa: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAll(sucursalId?: string, estado?: EstadoPedido) {
    const where: any = {};
    if (sucursalId) {
      where.mesa = { sucursalId };
    }
    if (estado) {
      where.estado = estado;
    }
    return this.prisma.pedido.findMany({
      where,
      include: { mesa: { include: { sucursal: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { mesa: { include: { sucursal: true } } }
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return pedido;
  }

  async updateEstado(id: string, estado: EstadoPedido) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { mesa: true }
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const updated = await this.prisma.pedido.update({
      where: { id },
      data: { estado },
      include: { mesa: { include: { sucursal: true } } }
    });

    // Emitir evento de cambio de estado a la sucursal correspondiente
    this.eventsGateway.notifyOrderStatusChanged(pedido.mesa.sucursalId, {
      ...updated,
      numeroMesa: pedido.mesa.numero,
      sucursalId: pedido.mesa.sucursalId
    });

    return updated;
  }
}
