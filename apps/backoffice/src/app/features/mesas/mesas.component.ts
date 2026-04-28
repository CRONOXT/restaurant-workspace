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

  // Cuentas modal
  showCuentasModal = false;
  cuentasMesa: DesgloseCuentas | null = null;
  cuentasMesaNumero: number | null = null;

  baseUrl = 'http://localhost:4200/mesa/';

  ngOnInit() {
    this.baseUrl = `http://${window.location.hostname}:4200/mesa/`;
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
  }

  loadMesas() {
    this.loading = true;
    this.cdr.detectChanges();
    this.mesasService.getMesas()
      .pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (data) => {
          this.mesas = data;
          if (data.length > 0 && !this.connectedSucursalId) {
            this.connectedSucursalId = data[0].sucursalId;
            this.eventsService.connect(this.connectedSucursalId);
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

  showOrderDetails(mesa: Mesa) {
    this.selectedOrderMesa = mesa;
    this.pedidosService.getPedidosPorMesa(mesa.id).subscribe({
      next: (pedidos) => {
        this.selectedMesaPedidos = pedidos;
        this.cdr.detectChanges();
      }
    });
  }

  closeOrderDetails() {
    this.selectedOrderMesa = null;
    this.selectedMesaPedidos = [];
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

  getEstadoLabel(estado: EstadoPedido): string {
    switch (estado) {
      case 'PENDIENTE': return '⏳ Pendiente';
      case 'ACEPTADO': return '👨‍🍳 En preparación';
      case 'ENTREGADO': return '✅ Entregado';
      default: return estado;
    }
  }

  getEstadoClass(estado: EstadoPedido): string {
    switch (estado) {
      case 'PENDIENTE': return 'estado-pendiente';
      case 'ACEPTADO': return 'estado-aceptado';
      case 'ENTREGADO': return 'estado-entregado';
      default: return '';
    }
  }
}
