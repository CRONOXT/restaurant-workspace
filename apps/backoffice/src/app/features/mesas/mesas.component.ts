import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { MesasService, Mesa } from '../../core/services/mesas.service';
import { PedidosService, Pedido, EstadoPedido } from '../../core/services/pedidos.service';
import { SesionesService, DesgloseCuentas } from '../../core/services/sesiones.service';
import { UiService } from '../../core/services/ui.service';
import { EventsService } from '../../core/services/events.service';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.css']
})
export class MesasComponent implements OnInit, OnDestroy {
  private mesasService = inject(MesasService);
  private pedidosService = inject(PedidosService);
  private sesionesService = inject(SesionesService);
  private eventsService = inject(EventsService);
  private authService = inject(AuthService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions: Subscription = new Subscription();

  mesas: Mesa[] = [];
  loading = true;
  selectedMesaQr: string | null = null;
  selectedMesaNumber: number | null = null;
  selectedOrderMesa: Mesa | null = null;
  selectedMesaPedidos: Pedido[] = [];
  connectedSucursalId: string | null = null;

  // Solicitudes de cierre pendientes
  pendingCloseRequests: { sesionId: string; mesaId: string; mesaNumero: number; solicitadoPor: string }[] = [];

  // Cuentas modal
  showCuentasModal = false;
  cuentasMesa: DesgloseCuentas | null = null;
  cuentasMesaNumero: number | null = null;

  baseUrl = 'http://localhost:4200/mesa/';

  ngOnInit() {
    // Si estamos en localhost, intentamos extraer la IP del apiUrl para que el QR funcione en móviles
    let hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const apiHostname = environment.apiUrl.split('//')[1]?.split(':')[0];
      if (apiHostname && apiHostname !== 'localhost') {
        hostname = apiHostname;
      }
    }
    this.baseUrl = `http://${hostname}:4200/mesa/`;
    this.loadMesas();
    this.setupWebSockets();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.eventsService.disconnect();
  }

  setupWebSockets() {
    this.subscriptions.add(
      this.eventsService.onTableOccupied().subscribe((mesa: Mesa) => {
        const found = this.mesas.find(m => m.id === mesa.id);
        if (found && !found.isOccupied) {
          found.isOccupied = true;
          this.cdr.detectChanges();
          this.uiService.showToast('Mesa Ocupada', `La Mesa ${mesa.numero} acaba de ser ocupada.`, 'info');
        }
      })
    );

    this.subscriptions.add(
      this.eventsService.onTableFreed().subscribe((mesa: Mesa) => {
        const found = this.mesas.find(m => m.id === mesa.id);
        if (found && found.isOccupied) {
          found.isOccupied = false;
          found.pedidosActivos = [];
          (found as any).sesiones = [];
          this.cdr.detectChanges();
          this.uiService.showToast('Mesa Libre', `La Mesa ${mesa.numero} ha sido liberada.`, 'success');
        }
      })
    );

    this.subscriptions.add(
      this.eventsService.onNewOrder().subscribe((pedidoData: any) => {
        const found = this.mesas.find(m => m.id === pedidoData.mesaId);
        if (found) {
          if (!found.pedidosActivos) found.pedidosActivos = [];
          found.pedidosActivos.unshift(pedidoData);
          this.cdr.detectChanges();

          const nombre = pedidoData.comensal?.nombre || 'Alguien';
          const compartido = pedidoData.esCompartido ? ' (compartido)' : '';
          const items = pedidoData.items as any[];
          const itemsStr = items.map((i: any) => `${i.cantidad}x ${i.nombre}`).join(', ');
          this.uiService.showToast(
            '¡Nuevo Pedido!',
            `${nombre} (Mesa ${found.numero}) pidió${compartido}: ${itemsStr}.`,
            'info'
          );
        }
      })
    );

    this.subscriptions.add(
      this.eventsService.onOrderStatusChanged().subscribe((pedidoData: any) => {
        for (const mesa of this.mesas) {
          if (mesa.pedidosActivos) {
            const pedido = mesa.pedidosActivos.find((p: any) => p.id === pedidoData.id);
            if (pedido) {
              pedido.estado = pedidoData.estado;
              if (pedidoData.estado === 'ENTREGADO') {
                mesa.pedidosActivos = mesa.pedidosActivos.filter((p: any) => p.id !== pedidoData.id);
              }
              break;
            }
          }
        }
        if (this.selectedMesaPedidos.length > 0) {
          const pedido = this.selectedMesaPedidos.find(p => p.id === pedidoData.id);
          if (pedido) pedido.estado = pedidoData.estado;
        }
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.eventsService.onComensalJoined().subscribe((data: any) => {
        const found = this.mesas.find(m => m.id === data.mesaId);
        if (found && (found as any).sesiones?.[0]) {
          const sesion = (found as any).sesiones[0];
          if (!sesion.comensales.find((c: any) => c.id === data.comensal.id)) {
            sesion.comensales.push(data.comensal);
          }
          this.cdr.detectChanges();
          this.uiService.showToast('Nuevo Comensal', `${data.comensal.nombre} se unió a Mesa ${found.numero}`, 'info');
        }
      })
    );

    // Recibir solicitud de cierre del líder
    this.subscriptions.add(
      this.eventsService.onCloseTableRequested().subscribe((data: any) => {
        const already = this.pendingCloseRequests.find(r => r.sesionId === data.sesionId);
        if (!already) {
          this.pendingCloseRequests.push({
            sesionId: data.sesionId,
            mesaId: data.mesaId,
            mesaNumero: data.mesaNumero,
            solicitadoPor: data.solicitadoPor,
          });
        }
        this.cdr.detectChanges();
        this.uiService.showToast(
          '⚠️ Solicitud de Cierre',
          `Mesa ${data.mesaNumero}: ${data.solicitadoPor} quiere cerrar la mesa. ¡Revísala!`,
          'info',
          0 // no auto-dismiss
        );
      })
    );
  }

  approveClose(req: { sesionId: string; mesaId: string; mesaNumero: number; solicitadoPor: string }) {
    // 1. Cerrar la sesión
    this.sesionesService.cerrarSesion(req.sesionId).subscribe({
      next: () => {
        // 2. Liberar la mesa
        this.mesasService.freeMesa(req.mesaId).subscribe({
          next: (mesa) => {
            // Notificar via WS al comensal que fue aprobado
            // El evento closeTableApproved lo envía el backend al liberar (ya lo hace mesaService.free)
            // Actualizar la mesa localmente
            const found = this.mesas.find(m => m.id === req.mesaId);
            if (found) {
              found.isOccupied = false;
              found.pedidosActivos = [];
              (found as any).sesiones = [];
            }
            this.pendingCloseRequests = this.pendingCloseRequests.filter(r => r.sesionId !== req.sesionId);
            this.uiService.showToast('Mesa Cerrada', `Mesa ${req.mesaNumero} cerrada correctamente ✓`, 'success');
            this.cdr.detectChanges();
          }
        });
      },
      error: () => this.uiService.showToast('Error', 'No se pudo cerrar la sesión', 'error')
    });
  }

  rejectClose(req: { sesionId: string; mesaId: string; mesaNumero: number; solicitadoPor: string }) {
    this.sesionesService.rechazarCierre(req.sesionId).subscribe({
      next: () => {
        this.pendingCloseRequests = this.pendingCloseRequests.filter(r => r.sesionId !== req.sesionId);
        this.uiService.showToast('Rechazado', `Solicitud de cierre de Mesa ${req.mesaNumero} rechazada`, 'info');
        this.cdr.detectChanges();
      },
      error: () => this.uiService.showToast('Error', 'No se pudo rechazar la solicitud', 'error')
    });
  }

  loadMesas() {
    this.loading = true;
    this.cdr.detectChanges();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const sucursalId = user.sucursalId || undefined;

    this.mesasService.getMesas(undefined, 1, 100, sucursalId) // Cargar mesas filtradas por sucursal si aplica
      .pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (res) => {
          this.mesas = res.data;
          // Si el usuario tiene sucursalId, usamos esa para WS, sino la primera de la lista
          const wsSucursalId = sucursalId || (res.data.length > 0 ? res.data[0].sucursalId : null);
          if (wsSucursalId && !this.connectedSucursalId) {
            this.connectedSucursalId = wsSucursalId;
            this.eventsService.connect(wsSucursalId);
          }
        },
        error: (err) => console.error('Error cargando mesas', err)
      });
  }

  freeMesaManual(mesa: Mesa) {
    if (!mesa.id) return;
    this.mesasService.freeMesa(mesa.id).subscribe({
      next: (m) => {
        const found = this.mesas.find(x => x.id === m.id);
        if (found) {
          found.isOccupied = false;
          found.pedidosActivos = [];
          (found as any).sesiones = [];
        }
      },
      error: () => this.uiService.showToast('Error', 'No se pudo liberar la mesa', 'error')
    });
  }

  showQr(mesa: Mesa) {
    this.selectedMesaQr = this.baseUrl + mesa.qrCode;
    this.selectedMesaNumber = mesa.numero;
  }

  closeQr() {
    this.selectedMesaQr = null;
    this.selectedMesaNumber = null;
  }

  // Agrupación de pedidos por comensal
  groupedPedidos: PedidoGroup[] = [];

  showOrderDetails(mesa: Mesa) {
    this.selectedOrderMesa = mesa;
    this.pedidosService.getPedidosPorMesa(mesa.id).subscribe({
      next: (pedidos) => {
        this.selectedMesaPedidos = pedidos;
        this.groupedPedidos = this.groupPedidosByComensal(pedidos);
        this.cdr.detectChanges();
      }
    });
  }

  closeOrderDetails() {
    this.selectedOrderMesa = null;
    this.selectedMesaPedidos = [];
    this.groupedPedidos = [];
  }

  private groupPedidosByComensal(pedidos: Pedido[]): PedidoGroup[] {
    const groups: Map<string, PedidoGroup> = new Map();

    for (const pedido of pedidos) {
      const key = pedido.esCompartido ? '__compartido__' : (pedido.comensalId || '__sin_asignar__');

      if (!groups.has(key)) {
        groups.set(key, {
          comensalId: pedido.esCompartido ? null : pedido.comensalId || null,
          comensalNombre: pedido.esCompartido ? '🤝 Compartido' : (pedido.comensal?.nombre || 'Sin asignar'),
          esCompartido: pedido.esCompartido,
          pedidos: [],
          items: [],
          total: 0,
        });
      }

      const group = groups.get(key)!;
      group.pedidos.push(pedido);
      group.total += pedido.total;

      // Merge items
      for (const item of (pedido.items as any[])) {
        const existing = group.items.find(i => i.nombre === item.nombre && i.precio === item.precio);
        if (existing) {
          existing.cantidad += item.cantidad;
        } else {
          group.items.push({ ...item });
        }
      }
    }

    // Ordenar: compartidos al final
    return Array.from(groups.values()).sort((a, b) => {
      if (a.esCompartido && !b.esCompartido) return 1;
      if (!a.esCompartido && b.esCompartido) return -1;
      return 0;
    });
  }

  showCuentas(mesa: Mesa) {
    const sesion = (mesa as any).sesiones?.[0];
    if (!sesion) {
      this.uiService.showToast('Info', 'No hay sesión activa en esta mesa', 'info');
      return;
    }
    this.cuentasMesaNumero = mesa.numero;
    this.sesionesService.getCuentas(sesion.id).subscribe({
      next: (data) => {
        this.cuentasMesa = data;
        this.showCuentasModal = true;
        this.cdr.detectChanges();
      },
      error: () => this.uiService.showToast('Error', 'No se pudieron cargar las cuentas', 'error')
    });
  }

  closeCuentas() {
    this.showCuentasModal = false;
    this.cuentasMesa = null;
    this.cuentasMesaNumero = null;
  }

  cambiarEstadoPedido(pedido: Pedido, nuevoEstado: EstadoPedido) {
    this.pedidosService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
      next: (updated) => {
        pedido.estado = updated.estado;
        if (nuevoEstado === 'ENTREGADO' && this.selectedOrderMesa?.pedidosActivos) {
          this.selectedOrderMesa.pedidosActivos = this.selectedOrderMesa.pedidosActivos.filter(
            (p: any) => p.id !== pedido.id
          );
        }
        const msg = nuevoEstado === 'ACEPTADO' ? 'Pedido aceptado ✓' : 'Pedido marcado como entregado ✓';
        this.uiService.showToast('Estado Actualizado', msg, 'success');
        this.cdr.detectChanges();
      },
      error: () => this.uiService.showToast('Error', 'No se pudo actualizar el estado del pedido', 'error')
    });
  }

  // Cambiar estado de todos los pedidos de un grupo a la vez
  cambiarEstadoGrupo(group: PedidoGroup, nuevoEstado: EstadoPedido) {
    const pedidosToUpdate = group.pedidos.filter(p => {
      if (nuevoEstado === 'ACEPTADO') return p.estado === 'PENDIENTE';
      if (nuevoEstado === 'ENTREGADO') return p.estado === 'ACEPTADO';
      return false;
    });

    if (pedidosToUpdate.length === 0) return;

    let completed = 0;
    for (const pedido of pedidosToUpdate) {
      this.pedidosService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
        next: (updated) => {
          pedido.estado = updated.estado;
          completed++;
          if (completed === pedidosToUpdate.length) {
            const msg = nuevoEstado === 'ACEPTADO'
              ? `${completed} pedido(s) aceptado(s) ✓`
              : `${completed} pedido(s) entregado(s) ✓`;
            this.uiService.showToast('Estado Actualizado', msg, 'success');
            this.cdr.detectChanges();
          }
        }
      });
    }
  }

  getGroupEstado(group: PedidoGroup): EstadoPedido | 'MIXTO' {
    const estados = new Set(group.pedidos.map(p => p.estado));
    if (estados.size === 1) return group.pedidos[0].estado;
    return 'MIXTO';
  }

  hasPendientes(group: PedidoGroup): boolean {
    return group.pedidos.some(p => p.estado === 'PENDIENTE');
  }

  hasAceptados(group: PedidoGroup): boolean {
    return group.pedidos.some(p => p.estado === 'ACEPTADO');
  }

  allEntregados(group: PedidoGroup): boolean {
    return group.pedidos.every(p => p.estado === 'ENTREGADO');
  }

  getPedidoCount(mesa: Mesa): number {
    return mesa.pedidosActivos ? mesa.pedidosActivos.length : 0;
  }

  getPendienteCount(mesa: Mesa): number {
    if (!mesa.pedidosActivos) return 0;
    return mesa.pedidosActivos.filter((p: any) => p.estado === 'PENDIENTE').length;
  }

  getComensalesCount(mesa: Mesa): number {
    return (mesa as any).sesiones?.[0]?.comensales?.length || 0;
  }

  getSesionCodigo(mesa: Mesa): string {
    return (mesa as any).sesiones?.[0]?.codigo || '';
  }

  getEstadoLabel(estado: EstadoPedido | string): string {
    switch (estado) {
      case 'PENDIENTE': return '⏳ Pendiente';
      case 'ACEPTADO': return '👨‍🍳 En preparación';
      case 'ENTREGADO': return '✅ Entregado';
      case 'MIXTO': return '⚡ Mixto';
      default: return estado;
    }
  }

  getEstadoClass(estado: EstadoPedido | string): string {
    switch (estado) {
      case 'PENDIENTE': return 'estado-pendiente';
      case 'ACEPTADO': return 'estado-aceptado';
      case 'ENTREGADO': return 'estado-entregado';
      case 'MIXTO': return 'estado-aceptado';
      default: return '';
    }
  }
}

export interface PedidoGroup {
  comensalId: string | null;
  comensalNombre: string;
  esCompartido: boolean;
  pedidos: Pedido[];
  items: any[];
  total: number;
}
