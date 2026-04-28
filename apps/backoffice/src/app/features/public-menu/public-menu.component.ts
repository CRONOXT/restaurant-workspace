import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { UiService } from '../../core/services/ui.service';
import { UiContainerComponent } from '../../shared/components/ui-container/ui-container.component';
import { PedidosService, Pedido, PedidoItem, EstadoPedido } from '../../core/services/pedidos.service';
import { EventsService } from '../../core/services/events.service';

interface Menu {
  id: string;
  nombre: string;
  moneda: string;
  sucursalId?: string;
  isActive?: boolean;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  disponible: boolean;
}

interface Categoria {
  id: string;
  nombre: string;
  productos: Producto[];
}

@Component({
  selector: 'app-public-menu',
  standalone: true,
  imports: [CommonModule, UiContainerComponent],
  templateUrl: './public-menu.component.html',
  styleUrls: ['./public-menu.component.css']
})
export class PublicMenuComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private uiService = inject(UiService);
  private pedidosService = inject(PedidosService);
  private eventsService = inject(EventsService);
  private subscriptions = new Subscription();

  menuId: string | null = null;
  sucursalId: string | null = null;
  mesaId: string | null = null;

  menu: Menu | null = null;
  categorias: Categoria[] = [];
  mesasDisponibles: any[] = [];
  mesaSeleccionada: any | null = null;

  loading = true;
  error = false;
  viewState: 'select_mesa' | 'menu' = 'menu';

  activeCategory: string | null = null;
  carrito: { producto: Producto, cantidad: number }[] = [];
  isCartOpen = false;

  // Pedidos realizados en esta sesión
  pedidosRealizados: Pedido[] = [];
  showPedidos = false;

  get cartTotal() {
    return this.carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  }

  get cartItemsCount() {
    return this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }

  get pedidosActivos(): Pedido[] {
    return this.pedidosRealizados.filter(p => p.estado !== 'ENTREGADO');
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const pathType = this.route.snapshot.url[0]?.path; // 'mesa' o 'carta'
    console.log(id);
    console.log(pathType);
    if (pathType === 'mesa' && id) {
      // El ID es en realidad un código QR de mesa
      this.loadMenuFromMesa(id);
    } else {
      // Comportamiento normal, si viene sucursal buscamos mesas
      this.menuId = id;
      this.sucursalId = this.route.snapshot.queryParamMap.get('sucursal') || id;
      
      if (this.sucursalId) {
        this.viewState = 'select_mesa';
        this.loadMesasDisponibles(this.sucursalId);
        this.loadMenuData();
      } else {
        this.viewState = 'menu';
        this.loadMenuData();
      }
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  setupWebSockets() {
    if (!this.sucursalId) return;
    this.eventsService.connect(this.sucursalId);
    
    this.subscriptions.add(
      this.eventsService.onOrderStatusChanged().subscribe((pedidoData: any) => {
        // Actualizar el estado del pedido en nuestra lista local
        const found = this.pedidosRealizados.find(p => p.id === pedidoData.id);
        if (found) {
          const estadoAnterior = found.estado;
          found.estado = pedidoData.estado;
          found.updatedAt = pedidoData.updatedAt;
          this.cdr.detectChanges();

          if (pedidoData.estado === 'ACEPTADO') {
            this.uiService.showToast('Pedido Aceptado', '¡Tu pedido ha sido aceptado y está siendo preparado!', 'success');
          } else if (pedidoData.estado === 'ENTREGADO') {
            this.uiService.showToast('Pedido Entregado', '¡Tu pedido ha sido marcado como entregado! ¡Buen provecho!', 'success');
          }
        }
      })
    );
  }

  loadMesasDisponibles(sucursalId: string) {
    this.http.get<any[]>(`${environment.apiUrl}/mesa?sucursalId=${sucursalId}`).subscribe({
      next: (mesas) => {
        this.mesasDisponibles = mesas.filter(m => !m.isOccupied && m.isActive);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => this.loading = false
    });
  }

  occupyMesa(mesa: any) {
    this.loading = true;
    this.http.put(`${environment.apiUrl}/mesa/${mesa.id}/occupy`, {}).subscribe({
      next: () => {
        this.mesaId = mesa.id;
        this.mesaSeleccionada = mesa;
        this.viewState = 'menu';
        this.loading = false;
        this.loadPedidosMesa();
        this.setupWebSockets();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  loadPedidosMesa() {
    if (!this.mesaId) return;
    this.pedidosService.getPedidosPorMesa(this.mesaId).subscribe({
      next: (pedidos) => {
        this.pedidosRealizados = pedidos;
        this.cdr.detectChanges();
      }
    });
  }

  loadMenuForSucursal(sucId: string) {
     this.http.get<Menu[]>(`${environment.apiUrl}/menu`).subscribe({
      next: (menus) => {
        const sucursalMenu = menus.find(m => m.sucursalId === sucId && m.isActive);
        if (sucursalMenu) {
          this.menuId = sucursalMenu.id;
          this.menu = sucursalMenu;
          this.loadCategories();
        } else {
          this.loadFallbackMenu();
        }
      },
      error: () => {
        this.error = true;
      }
    });
  }

  loadMenuFromMesa(qrCode: string) {
    // 1. Obtener la Mesa por su código QR
    this.http.get<any>(`${environment.apiUrl}/mesa/${qrCode}`).subscribe({
      next: (mesa) => {
        if (mesa && mesa.sucursalId) {
          this.mesaId = mesa.id;
          this.sucursalId = mesa.sucursalId;

          if (mesa.isOccupied) {
            // Mesa ya ocupada, simplemente cargar el menú 
            // aunque se podría mostrar un mensaje advirtiendo que ya está ocupada
            this.viewState = 'menu';
            this.mesaSeleccionada = mesa;
            this.loadMenuForSucursal(mesa.sucursalId);
            this.loadPedidosMesa();
            this.setupWebSockets();
          } else {
             // Permitir confirmarla
             this.viewState = 'select_mesa';
             this.mesasDisponibles = [mesa];
             this.loadMenuForSucursal(mesa.sucursalId); // precarga menú en fondo
          }
        } else {
          this.error = true;
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMenuData() {
    if (this.menuId) {
      this.http.get<Menu>(`${environment.apiUrl}/menu/${this.menuId}`).subscribe({
        next: (m) => {
          this.menu = m;
          this.loadCategories();
        },
        error: () => this.loadFallbackMenu()
      });
    } else {
      this.loadFallbackMenu();
    }
  }

  loadFallbackMenu() {
    this.http.get<Menu[]>(`${environment.apiUrl}/menu`).subscribe({
      next: (menus) => {
        if (menus && menus.length > 0) {
          this.menuId = menus[0].id;
          this.menu = menus[0];
          this.loadCategories();
        } else {
          this.error = true;
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories() {
    this.http.get<Categoria[]>(`${environment.apiUrl}/categoria?menuId=${this.menuId}`)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          // Filtrar categorías vacías y ordenar si es necesario
          this.categorias = data.filter(c => c.productos && c.productos.length > 0);
          if (this.categorias.length > 0) {
            this.activeCategory = this.categorias[0].id;
          }
        },
        error: () => {
          this.error = true;
        }
      });
  }

  scrollToCategory(catId: string) {
    this.activeCategory = catId;
    this.cdr.detectChanges();
  }

  get activeCategories() {
    if (!this.activeCategory) return this.categorias;
    return this.categorias.filter(c => c.id === this.activeCategory);
  }

  // --- CARRITO METHODS ---

  addToCart(producto: Producto) {
    const existing = this.carrito.find(item => item.producto.id === producto.id);
    if (existing) {
      existing.cantidad += 1;
    } else {
      this.carrito.push({ producto, cantidad: 1 });
    }
  }

  removeFromCart(productoId: string) {
    const existingIndex = this.carrito.findIndex(item => item.producto.id === productoId);
    if (existingIndex > -1) {
      if (this.carrito[existingIndex].cantidad > 1) {
        this.carrito[existingIndex].cantidad -= 1;
      } else {
        this.carrito.splice(existingIndex, 1);
      }
    }
  }

  getProductQuantity(productoId: string): number {
    const found = this.carrito.find(item => item.producto.id === productoId);
    return found ? found.cantidad : 0;
  }

  toggleCart() {
    if (this.carrito.length > 0) {
      this.isCartOpen = !this.isCartOpen;
    }
  }

  togglePedidos() {
    this.showPedidos = !this.showPedidos;
  }

  getEstadoLabel(estado: EstadoPedido): string {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'ACEPTADO': return 'En preparación';
      case 'ENTREGADO': return 'Entregado';
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

  enviarPedido() {
    if (!this.mesaId || this.carrito.length === 0) return;
    
    this.loading = true;
    const items: PedidoItem[] = this.carrito.map(item => ({
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      precio: item.producto.precio,
      cantidad: item.cantidad
    }));

    this.pedidosService.crearPedido(this.mesaId, items).subscribe({
      next: (pedido) => {
        this.pedidosRealizados.unshift(pedido);
        this.carrito = [];
        this.isCartOpen = false;
        this.loading = false;
        this.uiService.showToast('¡Éxito!', '¡Tu pedido ha sido enviado y está pendiente de aceptación!', 'success');
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.uiService.showToast('Error', 'Hubo un error al enviar el pedido, intenta de nuevo.', 'error');
        this.cdr.detectChanges();
      }
    });
  }
}

