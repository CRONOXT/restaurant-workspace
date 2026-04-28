import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class SesionService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway
  ) {}

  private generateCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async crear(mesaId: string, nombreLider: string) {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id: mesaId },
      include: { sucursal: true }
    });

    if (!mesa) {
      throw new NotFoundException('Mesa no encontrada');
    }

    // Verificar si ya hay una sesión activa en esta mesa
    const sesionActiva = await this.prisma.sesion.findFirst({
      where: { mesaId, isActive: true }
    });

    if (sesionActiva) {
      throw new BadRequestException('Ya existe una sesión activa en esta mesa. Usa el código para unirte.');
    }

    // Generar código único
    let codigo: string;
    let intentos = 0;
    do {
      codigo = this.generateCodigo();
      const existe = await this.prisma.sesion.findUnique({ where: { codigo } });
      if (!existe) break;
      intentos++;
    } while (intentos < 10);

    // Crear sesión + comensal líder en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      const sesion = await tx.sesion.create({
        data: {
          mesaId,
          codigo,
        }
      });

      const lider = await tx.comensal.create({
        data: {
          sesionId: sesion.id,
          nombre: nombreLider,
          esLider: true,
        }
      });

      // Marcar mesa como ocupada
      await tx.mesa.update({
        where: { id: mesaId },
        data: { isOccupied: true }
      });

      return { sesion, lider };
    });

    // Notificar mesa ocupada
    this.eventsGateway.notifyTableOccupied(mesa.sucursalId, mesa);

    // Notificar nuevo comensal
    this.eventsGateway.notifyComensalJoined(mesa.sucursalId, {
      sesionId: result.sesion.id,
      mesaId,
      comensal: result.lider,
    });

    return {
      sesion: {
        ...result.sesion,
        comensales: [result.lider],
      },
      comensal: result.lider,
      token: result.lider.token,
    };
  }

  async unirse(codigo: string, nombre: string) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { codigo },
      include: {
        mesa: { include: { sucursal: true } },
        comensales: true
      }
    });

    if (!sesion) {
      throw new NotFoundException('Código de sesión no válido');
    }

    if (!sesion.isActive) {
      throw new BadRequestException('Esta sesión ya no está activa');
    }

    const comensal = await this.prisma.comensal.create({
      data: {
        sesionId: sesion.id,
        nombre,
        esLider: false,
      }
    });

    // Notificar nuevo comensal a la sucursal
    this.eventsGateway.notifyComensalJoined(sesion.mesa.sucursalId, {
      sesionId: sesion.id,
      mesaId: sesion.mesaId,
      comensal,
    });

    return {
      sesion: {
        ...sesion,
        comensales: [...sesion.comensales, comensal],
      },
      comensal,
      token: comensal.token,
    };
  }

  async findById(id: string) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id },
      include: {
        mesa: { include: { sucursal: true } },
        comensales: true,
        pedidos: {
          include: { comensal: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }

    return sesion;
  }

  async findActivaByMesa(mesaId: string) {
    const sesion = await this.prisma.sesion.findFirst({
      where: { mesaId, isActive: true },
      include: {
        mesa: true,
        comensales: true,
      }
    });

    return sesion; // puede ser null si no hay sesión activa
  }

  async getComensalByToken(token: string) {
    const comensal = await this.prisma.comensal.findUnique({
      where: { token },
      include: {
        sesion: {
          include: {
            mesa: true,
            comensales: true,
          }
        }
      }
    });

    return comensal;
  }

  async getCuentas(sesionId: string) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        mesa: true,
        comensales: true,
        pedidos: {
          include: { comensal: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }

    const totalComensales = sesion.comensales.length || 1;

    // Pedidos compartidos
    const pedidosCompartidos = sesion.pedidos.filter(p => p.esCompartido);
    const totalCompartido = pedidosCompartidos.reduce((sum, p) => sum + p.total, 0);
    const porPersona = totalCompartido / totalComensales;

    // Cuentas individuales
    const cuentas = sesion.comensales.map(comensal => {
      const pedidosPersonales = sesion.pedidos.filter(
        p => p.comensalId === comensal.id && !p.esCompartido
      );
      const subtotal = pedidosPersonales.reduce((sum, p) => sum + p.total, 0);

      return {
        id: comensal.id,
        nombre: comensal.nombre,
        esLider: comensal.esLider,
        pedidos: pedidosPersonales,
        subtotal,
        parteCompartida: Math.round(porPersona * 100) / 100,
        totalAPagar: Math.round((subtotal + porPersona) * 100) / 100,
      };
    });

    return {
      sesionId: sesion.id,
      mesa: { id: sesion.mesa.id, numero: sesion.mesa.numero },
      comensales: cuentas,
      compartidos: {
        pedidos: pedidosCompartidos,
        total: totalCompartido,
        porPersona: Math.round(porPersona * 100) / 100,
      },
      totalMesa: Math.round(sesion.pedidos.reduce((sum, p) => sum + p.total, 0) * 100) / 100,
    };
  }

  async cerrar(sesionId: string) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: { mesa: { include: { sucursal: true } } }
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }

    const updated = await this.prisma.sesion.update({
      where: { id: sesionId },
      data: {
        isActive: false,
        closedAt: new Date(),
        cierreSolicitado: false,
      },
      include: { comensales: true }
    });

    return updated;
  }

  async solicitarCierre(sesionId: string) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        mesa: { include: { sucursal: true } },
        comensales: true
      }
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }

    if (!sesion.isActive) {
      throw new BadRequestException('Esta sesión ya no está activa');
    }

    await this.prisma.sesion.update({
      where: { id: sesionId },
      data: { cierreSolicitado: true }
    });

    // Notificar al camarero
    const lider = sesion.comensales.find(c => c.esLider);
    this.eventsGateway.notifyCloseRequested(sesion.mesa.sucursalId, {
      sesionId: sesion.id,
      mesaId: sesion.mesaId,
      mesaNumero: sesion.mesa.numero,
      solicitadoPor: lider?.nombre || 'Líder',
    });

    return { success: true, message: 'Solicitud de cierre enviada al camarero' };
  }

  async rechazarCierre(sesionId: string) {
    const sesion = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      include: {
        mesa: { include: { sucursal: true } },
      }
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }

    await this.prisma.sesion.update({
      where: { id: sesionId },
      data: { cierreSolicitado: false }
    });

    // Notificar al comensal que fue rechazado
    this.eventsGateway.notifyCloseRejected(sesion.mesa.sucursalId, {
      sesionId: sesion.id,
      mesaId: sesion.mesaId,
      mesaNumero: sesion.mesa.numero,
    });

    return { success: true, message: 'Solicitud de cierre rechazada' };
  }
}
