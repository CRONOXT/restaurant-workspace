import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(empresaId?: string, sucursalId?: string) {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // Filtro base para multi-tenant
    const baseWhere = {
      ...(sucursalId && { mesa: { sucursalId } }),
      ...(empresaId && { mesa: { sucursal: { empresaId } } })
    };

    // 1. Ventas de hoy
    const ordersToday = await this.prisma.pedido.findMany({
      where: {
        estado: { in: ['ENTREGADO', 'PAGADO'] },
        createdAt: { gte: start, lte: end },
        ...baseWhere
      },
      select: { total: true }
    });
    const ventasHoy = ordersToday.reduce((sum, o) => sum + o.total, 0);

    // 2. Pedidos en curso
    const pedidosEnCurso = await this.prisma.pedido.count({
      where: {
        estado: { in: ['PENDIENTE', 'ACEPTADO'] },
        ...baseWhere
      }
    });

    // 3. Mesas
    const mesasTotales = await this.prisma.mesa.count({
      where: { 
        isActive: true, 
        ...(sucursalId && { sucursalId }),
        ...(empresaId && { sucursal: { empresaId } })
      }
    });
    const mesasOcupadas = await this.prisma.mesa.count({
      where: { 
        isActive: true, 
        isOccupied: true, 
        ...(sucursalId && { sucursalId }),
        ...(empresaId && { sucursal: { empresaId } })
      }
    });

    // SaaS Metrics (Solo para SuperAdmin)
    let totalClientes = 0;
    let totalSucursales = 0;
    if (!empresaId && !sucursalId) {
      totalClientes = await this.prisma.empresa.count();
      totalSucursales = await this.prisma.sucursal.count();
    }

    // 4. Platos populares
    const recentOrders = await this.prisma.pedido.findMany({
      where: { estado: { in: ['ENTREGADO', 'PAGADO'] }, ...baseWhere },
      take: 200,
      orderBy: { createdAt: 'desc' }
    });

    const productsMap: Record<string, { nombre: string; cantidad: number; total: number }> = {};
    recentOrders.forEach(order => {
      const items = order.items as any[];
      items.forEach(item => {
        if (!productsMap[item.nombre]) {
          productsMap[item.nombre] = { nombre: item.nombre, cantidad: 0, total: 0 };
        }
        productsMap[item.nombre].cantidad += item.cantidad;
        productsMap[item.nombre].total += item.precio * item.cantidad;
      });
    });

    const platosPopulares = Object.values(productsMap)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // 5. Ventas últimos 7 días
    const ventasUltimaSemana = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const dayOrders = await this.prisma.pedido.findMany({
        where: {
          estado: { in: ['ENTREGADO', 'PAGADO'] },
          createdAt: { gte: dayStart, lte: dayEnd },
          ...baseWhere
        },
        select: { total: true }
      });

      ventasUltimaSemana.push({
        fecha: format(day, 'dd/MM'),
        total: dayOrders.reduce((sum, o) => sum + o.total, 0)
      });
    }

    return {
      ventasHoy,
      pedidosEnCurso,
      mesasOcupadas,
      mesasTotales,
      platosPopulares,
      ventasUltimaSemana,
      totalClientes,
      totalSucursales
    };
  }
}
