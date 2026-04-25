import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { MesasService, Mesa } from '../../core/services/mesas.service';
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
  private eventsService = inject(EventsService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions: Subscription = new Subscription();

  mesas: Mesa[] = [];
  loading = true;
  selectedMesaQr: string | null = null;
  selectedMesaNumber: number | null = null;
  selectedOrderMesa: Mesa | null = null;
  connectedSucursalId: string | null = null;

  // En producción, esto debería venir de las variables de entorno
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
          this.uiService.showToast('Mesa Ocupada', `La Mesa ${mesa.numero} acaba de ser ocupada en tu sucursal.`, 'info');
        }
      })
    );

    this.subscriptions.add(
      this.eventsService.onTableFreed().subscribe((mesa: Mesa) => {
        const found = this.mesas.find(m => m.id === mesa.id);
        if (found && found.isOccupied) {
          found.isOccupied = false;
          found.pedidosActivos = [];
          this.cdr.detectChanges();
          this.uiService.showToast('Mesa Libre', `La Mesa ${mesa.numero} ha sido liberada.`, 'success');
        }
      })
    );

    this.subscriptions.add(
      this.eventsService.onNewOrder().subscribe((orderData: any) => {
        const found = this.mesas.find(m => m.id === orderData.mesaId);
        if (found) {
          const tableStr = `Mesa ${found.numero}`;
          const itemsStr = orderData.items.map((i: any) => `${i.cantidad}x ${i.nombre}`).join(', ');
          
          if (!found.pedidosActivos) {
            found.pedidosActivos = [];
          }
          found.pedidosActivos.push(orderData);
          
          this.cdr.detectChanges();

          this.uiService.showToast(
            '¡Nuevo Pedido!', 
            `La ${tableStr} ordenó: ${itemsStr}.`, 
            'info'
          );
        }
      })
    );
  }

  loadMesas() {
    this.loading = true;
    this.cdr.detectChanges();
    this.mesasService.getMesas()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
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

  createMesa() {
    // Por ahora harcodearemos el sucursalId, en el futuro vendrá de Auth/Context
    const newMesa: Partial<Mesa> = {
      numero: this.mesas.length + 1,
      capacidad: 4,
      isActive: true,
      sucursalId: 'sucursal-default-id' // Asegúrate de crear una sucursal en BD con este ID o ajustarlo luego
    };

    // Esto fallará si no existe una sucursal con ese ID en la BD debido a la llave foránea
    this.mesasService.createMesa(newMesa).subscribe({
      next: () => this.loadMesas(),
      error: (err) => alert('Error: Debes crear una Sucursal primero en la BD (o vía Swagger).')
    });
  }

  freeMesaManual(mesa: Mesa) {
    if (!mesa.id) return;
    this.mesasService.freeMesa(mesa.id).subscribe({
      next: (m) => {
        // Optimistic update, aunque debería venir por WebSocket también
        const found = this.mesas.find(x => x.id === m.id);
        if (found) found.isOccupied = false;
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
  }

  closeOrderDetails() {
    this.selectedOrderMesa = null;
  }

  getAllItems(mesa: Mesa): any[] {
    if (!mesa.pedidosActivos) return [];
    return mesa.pedidosActivos.reduce((acc, pedido) => {
      return acc.concat(pedido.items);
    }, []);
  }
}
