import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SucursalesService, Sucursal } from '../../core/services/sucursales.service';
import { UiService } from '../../core/services/ui.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.css']
})
export class SucursalesComponent implements OnInit {
  private sucursalesService = inject(SucursalesService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);
  
  sucursales: Sucursal[] = [];
  loading = true;
  
  // Pagination & Search state
  searchTerm = '';
  private searchSubject = new Subject<string>();
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  // Modal state
  showModal = false;
  isEditing = false;
  saving = false;
  
  // Form model
  currentSucursal: Partial<Sucursal> = {};

  ngOnInit() {
    this.loadSucursales();

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.currentPage = 1; // Reset to first page on search
      this.loadSucursales();
    });
  }

  onSearch(term: string) {
    this.searchSubject.next(term);
  }

  loadSucursales() {
    this.loading = true;
    this.sucursalesService.getSucursales(this.searchTerm, this.currentPage, this.pageSize)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.sucursales = res.data;
          this.totalItems = res.total;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error cargando sucursales', err)
      });
  }

  changePage(page: number) {
    this.currentPage = page;
    this.loadSucursales();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentSucursal = { nombre: '', direccion: '', numeroMesas: 0, isActive: true };
    this.showModal = true;
  }

  openEditModal(sucursal: Sucursal) {
    this.isEditing = true;
    this.currentSucursal = { ...sucursal };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentSucursal = {};
  }

  saveSucursal() {
    this.saving = true;
    const request = this.isEditing && this.currentSucursal.id
      ? this.sucursalesService.updateSucursal(this.currentSucursal.id, this.currentSucursal)
      : this.sucursalesService.createSucursal(this.currentSucursal);

    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.uiService.showToast('¡Éxito!', 'Sucursal guardada correctamente.', 'success');
        this.closeModal();
        this.loadSucursales();
      },
      error: (err) => {
        console.error('Error guardando', err);
        this.uiService.showToast('Error', 'Ocurrió un error al guardar la sucursal.', 'error');
      }
    });
  }

  deleteSucursal(id: string) {
    this.uiService.showConfirm({
      title: 'Eliminar Sucursal',
      message: '¿Estás seguro de que deseas eliminar esta sucursal? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      onConfirm: () => {
        this.sucursalesService.deleteSucursal(id).subscribe({
          next: () => {
            this.uiService.showToast('¡Eliminada!', 'La sucursal fue eliminada.', 'success');
            this.loadSucursales();
          },
          error: (err) => this.uiService.showToast('Error', 'No se pudo eliminar. Puede que tenga mesas o menús activos.', 'error')
        });
      }
    });
  }
}
