import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { UiService } from '../../core/services/ui.service';
import { UiContainerComponent } from '../../shared/components/ui-container/ui-container.component';
import { PedidosService, Pedido, PedidoItem, EstadoPedido } from '../../core/services/pedidos.service';
import { SesionesService, Sesion, Comensal, DesgloseCuentas } from '../../core/services/sesiones.service';
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
  imports: [CommonModule, FormsModule, UiContainerComponent],
  templateUrl: './public-menu.component.html',
  styleUrls: ['./public-menu.component.css']
})
export class PublicMenuComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private uiService = inject(UiService);
  private pedidosService = inject(PedidosService);
  private sesionesService = inject(SesionesService);
  private eventsService = inject(EventsService);
  private subscriptions = new Subscription();

  // Token key for localStorage
  private readonly TOKEN_KEY = 'comensal_token';

  menuId: string | null = null;
  sucursalId: string | null = null;
  mesaId: string | null = null;

  menu: Menu | null = null;
  categorias: Categoria[] = [];
  mesasDisponibles: any[] = [];
  mesaSeleccionada: any | null = null;

  loading = true;
  error = false;
  viewState: 'loading' | 'identify' | 'join_session' | 'menu' = 'loading';

  // Sesión y comensal
  sesion: Sesion | null = null;
  comensalActual: Comensal | null = null;
  nombreInput = '';
  codigoInput = '';

  // Menú
  activeCategory: string | null = null;
  carrito: { producto: Producto, cantidad: number }[] = [];
  isCartOpen = false;
  esCompartido = false;

  // Pedidos y cuentas
  pedidosRealizados: Pedido[] = [];
  showPedidos = false;
  showMiCuenta = false;
  showInvitar = false;
  desgloseCuentas: DesgloseCuentas | null = null;

  get cartTotal() {
    return this.carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  }

  get cartItemsCount() {
    return this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }

  get pedidosActivos(): Pedido[] {
    return this.pedidosRealizados.filter(p => p.estado !== 'ENTREGADO');
  }

  get miCuenta(): any {
    if (!this.desgloseCuentas || !this.comensalActual) return null;
    return this.desgloseCuentas.comensales.find(c => c.id === this.comensalActual!.id);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const pathType = this.route.snapshot.url[0]?.path;

    if (pathType === 'mesa' && id) {
      this.loadMenuFromMesa(id);
    } else {
      this.menuId = id;
      this.sucursalId = this.route.snapshot.queryParamMap.get('sucursal') || id;
      if (this.sucursalId) {
        this.viewState = 'identify';
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

  // --- IDENTIFICATION FLOW ---

  private checkExistingToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return;

    this.sesionesService.getComensalByToken(token).subscribe({
      next: (comensal) => {
        if (comensal && (comensal as any).sesion?.isActive) {
          // Reconexión exitosa
          this.comensalActual = comensal;
          this.sesion = (comensal as any).sesion;
          this.mesaId = this.sesion!.mesaId;
          this.viewState = 'menu';
          this.loadPedidosSesion();
          this.setupWebSockets();
          this.cdr.detectChanges();
        }
      },
      error: () => {
        // Token inválido, ignorar
        localStorage.removeItem(this.TOKEN_KEY);
      }
    });
  }

  loadMenuFromMesa(qrCode: string) {
    this.http.get<any>(`${environment.apiUrl}/mesa/${qrCode}`).subscribe({
      next: (mesa) => {
        if (mesa && mesa.sucursalId) {
          this.mesaId = mesa.id;
          this.sucursalId = mesa.sucursalId;
          this.mesaSeleccionada = mesa;

          // Verificar si tenemos un token guardado
          const token = localStorage.getItem(this.TOKEN_KEY);
          if (token) {
            this.sesionesService.getComensalByToken(token).subscribe({
              next: (comensal) => {
                if (comensal && (comensal as any).sesion?.isActive && (comensal as any).sesion?.mesaId === mesa.id) {
                  this.comensalActual = comensal;
                  this.sesion = (comensal as any).sesion;
                  this.viewState = 'menu';
                  this.loadMenuForSucursal(mesa.sucursalId);
                  this.loadPedidosSesion();
                  this.setupWebSockets();
                  this.loading = false;
                  this.cdr.detectChanges();
                  return;
                }
                // Token no válido para esta mesa
                this.handleMesaEntry(mesa);
              },
              error: () => this.handleMesaEntry(mesa)
            });
          } else {
            this.handleMesaEntry(mesa);
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

  private handleMesaEntry(mesa: any) {
    this.loadMenuForSucursal(mesa.sucursalId);

    if (mesa.isOccupied) {
      // Mesa ocupada → hay sesión activa → mostrar formulario para unirse
      this.sesionesService.getSesionActiva(mesa.id).subscribe({
        next: (sesion) => {
          if (sesion) {
            this.sesion = sesion;
            this.viewState = 'join_session';
          } else {
            // Ocupada pero sin sesión activa (caso raro), crear nueva
            this.viewState = 'identify';
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.viewState = 'identify';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Mesa libre → crear sesión
      this.viewState = 'identify';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  crearSesion() {
    if (!this.mesaId || !this.nombreInput.trim()) return;

    this.loading = true;
    this.sesionesService.crearSesion(this.mesaId, this.nombreInput.trim()).subscribe({
      next: (result) => {
        this.sesion = result.sesion;
        this.comensalActual = result.comensal;
        localStorage.setItem(this.TOKEN_KEY, result.token);
        this.viewState = 'menu';
        this.loading = false;
        this.setupWebSockets();
        this.uiService.showToast('¡Bienvenido!', `Sesión creada. Tu código de invitación: ${result.sesion.codigo}`, 'success', 6000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Error al crear la sesión';
        this.uiService.showToast('Error', msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  unirseASesion() {
    if (!this.codigoInput.trim() || !this.nombreInput.trim()) return;

    this.loading = true;
    this.sesionesService.unirseASesion(this.codigoInput.trim(), this.nombreInput.trim()).subscribe({
      next: (result) => {
        this.sesion = result.sesion;
        this.comensalActual = result.comensal;
        this.mesaId = result.sesion.mesaId;
        localStorage.setItem(this.TOKEN_KEY, result.token);
        this.viewState = 'menu';
        this.loading = false;
        this.loadPedidosSesion();
        this.setupWebSockets();
        this.uiService.showToast('¡Bienvenido!', `Te uniste a la mesa. ¡A pedir!`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Código no válido o sesión inactiva';
        this.uiService.showToast('Error', msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // --- WEBSOCKETS ---

  setupWebSockets() {
    if (!this.sucursalId) return;
    this.eventsService.connect(this.sucursalId);

    this.subscriptions.add(
      this.eventsService.onOrderStatusChanged().subscribe((pedidoData: any) => {
        const found = this.pedidosRealizados.find(p => p.id === pedidoData.id);
        if (found) {
          found.estado = pedidoData.estado;
          found.updatedAt = pedidoData.updatedAt;
          this.cdr.detectChanges();

          if (pedidoData.estado === 'ACEPTADO') {
            this.uiService.showToast('Pedido Aceptado', '¡Tu pedido ha sido aceptado y está siendo preparado!', 'success');
          } else if (pedidoData.estado === 'ENTREGADO') {
            this.uiService.showToast('Pedido Entregado', '¡Tu pedido ha sido entregado! ¡Buen provecho!', 'success');
          }
        }
      })
    );

    this.subscriptions.add(
      this.eventsService.onNewOrder().subscribe((pedidoData: any) => {
        // Si es un pedido de nuestra sesión pero no nuestro, actualizar la lista
        if (pedidoData.sesionId === this.sesion?.id && pedidoData.comensalId !== this.comensalActual?.id) {
          this.pedidosRealizados.unshift(pedidoData);
          const nombre = pedidoData.comensal?.nombre || 'Alguien';
          this.uiService.showToast('Nuevo Pedido', `${nombre} ha hecho un pedido`, 'info');
          this.cdr.detectChanges();
        }
      })
    );

    this.subscriptions.add(
      this.eventsService.onComensalJoined().subscribe((data: any) => {
        if (data.sesionId === this.sesion?.id) {
          // Agregar nuevo comensal a la lista local
          if (this.sesion && !this.sesion.comensales.find(c => c.id === data.comensal.id)) {
            this.sesion.comensales.push(data.comensal);
          }
          this.uiService.showToast('Nuevo Comensal', `${data.comensal.nombre} se unió a la mesa`, 'info');
          this.cdr.detectChanges();
        }
      })
    );
  }

  // --- MENU LOADING ---

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
      error: () => { this.error = true; }
    });
  }

  loadMenuData() {
    if (this.menuId) {
      this.http.get<Menu>(`${environment.apiUrl}/menu/${this.menuId}`).subscribe({
        next: (m) => { this.menu = m; this.loadCategories(); },
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
      error: () => { this.error = true; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadCategories() {
    this.http.get<Categoria[]>(`${environment.apiUrl}/categoria?menuId=${this.menuId}`)
      .pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (data) => {
          this.categorias = data.filter(c => c.productos && c.productos.length > 0);
          if (this.categorias.length > 0) {
            this.activeCategory = this.categorias[0].id;
          }
        },
        error: () => { this.error = true; }
      });
  }

  loadPedidosSesion() {
    if (!this.sesion?.id) return;
    this.pedidosService.getPedidosPorSesion(this.sesion.id).subscribe({
      next: (pedidos) => {
        this.pedidosRealizados = pedidos;
        this.cdr.detectChanges();
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

  // --- CARRITO ---

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

  togglePedidos() { this.showPedidos = !this.showPedidos; }
  toggleInvitar() { this.showInvitar = !this.showInvitar; }

  toggleMiCuenta() {
    this.showMiCuenta = !this.showMiCuenta;
    if (this.showMiCuenta && this.sesion?.id) {
      this.sesionesService.getCuentas(this.sesion.id).subscribe({
        next: (data) => {
          this.desgloseCuentas = data;
          this.cdr.detectChanges();
        }
      });
    }
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
    if (!this.mesaId || this.carrito.length === 0 || !this.comensalActual || !this.sesion) return;

    this.loading = true;
    const items: PedidoItem[] = this.carrito.map(item => ({
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      precio: item.producto.precio,
      cantidad: item.cantidad
    }));

    this.pedidosService.crearPedido(
      this.mesaId,
      items,
      undefined,
      this.sesion.id,
      this.esCompartido ? undefined : this.comensalActual.id,
      this.esCompartido
    ).subscribe({
      next: (pedido) => {
        this.pedidosRealizados.unshift(pedido);
        this.carrito = [];
        this.isCartOpen = false;
        this.esCompartido = false;
        this.loading = false;
        const tipo = pedido.esCompartido ? '(compartido) ' : '';
        this.uiService.showToast('¡Éxito!', `¡Pedido ${tipo}enviado y pendiente de aceptación!`, 'success');
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
