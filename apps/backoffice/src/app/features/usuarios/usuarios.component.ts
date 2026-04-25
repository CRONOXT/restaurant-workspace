import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from '../../core/services/usuarios.service';
import { SucursalesService, Sucursal } from '../../core/services/sucursales.service';
import { UiService } from '../../core/services/ui.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private sucursalesService = inject(SucursalesService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);
  
  usuarios: Usuario[] = [];
  sucursales: Sucursal[] = [];
  loading = true;
  
  // Modal state
  showModal = false;
  isEditing = false;
  saving = false;
  
  // Form model
  currentUsuario: Partial<Usuario> = {};

  ngOnInit() {
    this.loadUsuarios();
    this.loadSucursales();
  }

  loadUsuarios() {
    this.loading = true;
    this.usuariosService.getUsuarios()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.usuarios = data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error cargando usuarios', err)
      });
  }

  loadSucursales() {
    this.sucursalesService.getSucursales().subscribe({
      next: (data) => {
        this.sucursales = data;
        this.cdr.detectChanges();
      }
    });
  }

  getSucursalName(id?: string): string {
    if (!id) return 'N/A';
    const s = this.sucursales.find(x => x.id === id);
    return s ? s.nombre : 'Desconocida';
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentUsuario = { nombre: '', email: '', password: '', rol: 'CAMARERO', sucursalId: '', isActive: true };
    this.showModal = true;
  }

  openEditModal(usuario: Usuario) {
    this.isEditing = true;
    this.currentUsuario = { ...usuario };
    // Evitamos mostrar la contraseña
    delete this.currentUsuario.password;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentUsuario = {};
  }

  saveUsuario() {
    this.saving = true;
    
    // No enviamos el ID en el payload, solo en la URL si es update
    const { id, ...dataToSave } = this.currentUsuario;
    
    // Si no se asignó sucursal, asegurar que vaya como undefined (o omitirlo)
    if (!dataToSave.sucursalId) {
      delete dataToSave.sucursalId;
    }

    const request = this.isEditing && id
      ? this.usuariosService.updateUsuario(id, dataToSave)
      : this.usuariosService.createUsuario(dataToSave);

    request.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => {
        this.uiService.showToast('¡Éxito!', 'Usuario guardado correctamente.', 'success');
        this.closeModal();
        this.loadUsuarios();
      },
      error: (err) => {
        console.error('Error guardando usuario', err);
        this.uiService.showToast('Error', err.error?.message || 'Ocurrió un error al guardar el usuario.', 'error');
      }
    });
  }

  deleteUsuario(id: string) {
    this.uiService.showConfirm({
      title: 'Eliminar Usuario',
      message: '¿Estás seguro de que deseas eliminar a este usuario? Esta acción es irreversible.',
      confirmText: 'Sí, eliminar',
      onConfirm: () => {
        this.usuariosService.deleteUsuario(id).subscribe({
          next: () => {
            this.uiService.showToast('¡Eliminado!', 'El usuario fue eliminado.', 'success');
            this.loadUsuarios();
          },
          error: (err) => this.uiService.showToast('Error', 'No se pudo eliminar el usuario.', 'error')
        });
      }
    });
  }
}
