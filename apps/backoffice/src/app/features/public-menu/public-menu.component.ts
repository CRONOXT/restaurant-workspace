import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';
import { UiService } from '../../core/services/ui.service';
import { UiContainerComponent } from '../../shared/components/ui-container/ui-container.component';

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
export class PublicMenuComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private uiService = inject(UiService);

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

  get cartTotal() {
    return this.carrito.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  }

  get cartItemsCount() {
    return this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
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
        this.mesaId = mesa.id; // ¡Faltaba asignar el ID de la mesa para poder realizar el pedido!
        this.mesaSeleccionada = mesa;
        this.viewState = 'menu';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.error = true;
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

  enviarPedido() {
    if (!this.mesaId || this.carrito.length === 0) return;
    
    this.loading = true;
    const items = this.carrito.map(item => ({
      productoId: item.producto.id,
      nombre: item.producto.nombre,
      precio: item.producto.precio,
      cantidad: item.cantidad
    }));

    this.http.post(`${environment.apiUrl}/mesa/${this.mesaId}/order`, { items }).subscribe({
      next: () => {
        this.carrito = [];
        this.isCartOpen = false;
        this.loading = false;
        this.uiService.showToast('¡Éxito!', '¡Tu pedido ha sido enviado con éxito!', 'success');
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
