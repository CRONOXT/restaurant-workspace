import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';

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
  imports: [CommonModule],
  templateUrl: './public-menu.component.html',
  styleUrls: ['./public-menu.component.css']
})
export class PublicMenuComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  menuId: string | null = null;
  sucursalId: string | null = null;

  menu: Menu | null = null;
  categorias: Categoria[] = [];

  loading = true;
  error = false;

  activeCategory: string | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const pathType = this.route.snapshot.url[0]?.path; // 'mesa' o 'carta'
    console.log(id);
    console.log(pathType);
    if (pathType === 'mesa' && id) {
      // El ID es en realidad un código QR de mesa
      this.loadMenuFromMesa(id);
    } else {
      // Comportamiento normal
      this.menuId = id;
      this.sucursalId = this.route.snapshot.queryParamMap.get('sucursal');
      this.loadMenuData();
    }
  }

  loadMenuFromMesa(qrCode: string) {
    // 1. Obtener la Mesa por su código QR
    this.http.get<any>(`${environment.apiUrl}/mesa/${qrCode}`).subscribe({
      next: (mesa) => {
        if (mesa && mesa.sucursalId) {
          // 2. Buscar el menú activo de esa sucursal
          this.http.get<Menu[]>(`${environment.apiUrl}/menu`).subscribe({
            next: (menus) => {
              const sucursalMenu = menus.find(m => m.sucursalId === mesa.sucursalId && m.isActive);
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
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
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
    const element = document.getElementById(`cat-${catId}`);
    if (element) {
      const headerOffset = 140; // Height of the sticky header + some padding
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
