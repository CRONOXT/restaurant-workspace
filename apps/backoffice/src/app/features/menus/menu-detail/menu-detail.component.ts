import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MenusService, Menu } from '../../../core/services/menus.service';
import { CategoriasService, Categoria, Producto } from '../../../core/services/categorias.service';
import { ProductosService } from '../../../core/services/productos.service';
import { UiService } from '../../../core/services/ui.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-menu-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './menu-detail.component.html',
  styleUrls: ['./menu-detail.component.css']
})
export class MenuDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menusService = inject(MenusService);
  private categoriasService = inject(CategoriasService);
  private productosService = inject(ProductosService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);

  menuId: string = '';
  menu: Menu | null = null;
  categorias: Categoria[] = [];
  loading = true;
  saving = false;

  // UI State
  expandedCategory: string | null = null;
  
  // Modals
  showCatModal = false;
  catForm: Partial<Categoria> = {};

  showProdModal = false;
  prodForm: Partial<Producto> = { disponible: true };

  ngOnInit() {
    this.menuId = this.route.snapshot.paramMap.get('id') || '';
    if (this.menuId) {
      this.loadMenuData();
    }
  }

  loadMenuData() {
    this.loading = true;
    this.menusService.getMenu(this.menuId).subscribe({
      next: (m) => {
        this.menu = m;
        this.loadCategorias();
      },
      error: () => {
        this.uiService.showToast('Error', 'No se pudo cargar el menú', 'error');
        this.router.navigate(['/menus']);
      }
    });
  }

  loadCategorias() {
    this.categoriasService.getCategorias(this.menuId)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.categorias = data;
          this.cdr.detectChanges();
        }
      });
  }

  toggleCategory(catId: string) {
    this.expandedCategory = this.expandedCategory === catId ? null : catId;
    this.cdr.detectChanges();
  }

  // --- Category Actions ---
  openCatModal(cat?: Categoria) {
    this.catForm = cat ? { ...cat } : { menuId: this.menuId, orden: 0 };
    this.showCatModal = true;
    this.cdr.detectChanges();
  }

  closeCatModal() {
    this.showCatModal = false;
    this.catForm = {};
    this.cdr.detectChanges();
  }

  saveCategoria() {
    this.saving = true;
    const request = this.catForm.id 
      ? this.categoriasService.updateCategoria(this.catForm.id, this.catForm)
      : this.categoriasService.createCategoria(this.catForm);

    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.uiService.showToast('¡Éxito!', 'Categoría guardada', 'success');
        this.closeCatModal();
        this.loadCategorias();
      },
      error: () => this.uiService.showToast('Error', 'No se pudo guardar la categoría', 'error')
    });
  }

  deleteCategoria(id: string) {
    this.uiService.showConfirm({
      title: 'Eliminar Categoría',
      message: '¿Seguro que deseas eliminar esta categoría? Se eliminarán también sus productos.',
      onConfirm: () => {
        this.categoriasService.deleteCategoria(id).subscribe({
          next: () => {
            this.uiService.showToast('¡Eliminada!', 'Categoría eliminada', 'success');
            this.loadCategorias();
          }
        });
      }
    });
  }

  // --- Product Actions ---
  openProdModal(catId: string, prod?: Producto) {
    this.prodForm = prod 
      ? { ...prod } 
      : { categoriaId: catId, disponible: true, precio: 0 };
    this.showProdModal = true;
    this.cdr.detectChanges();
  }

  closeProdModal() {
    this.showProdModal = false;
    this.prodForm = { disponible: true };
    this.cdr.detectChanges();
  }

  saveProducto() {
    this.saving = true;
    const request = this.prodForm.id
      ? this.productosService.updateProducto(this.prodForm.id, this.prodForm)
      : this.productosService.createProducto(this.prodForm);

    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.uiService.showToast('¡Éxito!', 'Producto guardado', 'success');
        this.closeProdModal();
        this.loadCategorias(); // Reload to get updated products
      },
      error: () => this.uiService.showToast('Error', 'No se pudo guardar el producto', 'error')
    });
  }

  deleteProducto(id: string) {
    this.uiService.showConfirm({
      title: 'Eliminar Producto',
      message: '¿Seguro que deseas eliminar este producto?',
      onConfirm: () => {
        this.productosService.deleteProducto(id).subscribe({
          next: () => {
            this.uiService.showToast('¡Eliminado!', 'Producto eliminado', 'success');
            this.loadCategorias();
          }
        });
      }
    });
  }
}
