import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as QRCode from 'qrcode';
import { finalize } from 'rxjs/operators';
import { Menu, MenusService } from '../../core/services/menus.service';
import {
  Sucursal,
  SucursalesService,
} from '../../core/services/sucursales.service';
import { UiService } from '../../core/services/ui.service';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './menus.component.html',
  styleUrls: ['./menus.component.css'],
})
export class MenusComponent implements OnInit {
  private menusService = inject(MenusService);
  private sucursalesService = inject(SucursalesService);
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);

  menus: Menu[] = [];
  sucursales: Sucursal[] = [];
  loading = true;

  // Modal state
  showModal = false;
  isEditing = false;
  saving = false;

  // Form model
  currentMenu: Partial<Menu> = {};

  // QR Modal state
  showQrModal = false;
  qrCodeUrl = '';
  qrMenuName = '';
  baseIp = '192.168.50.221';
  currentMenuForQr: Menu | null = null;

  ngOnInit() {
    this.loadMenus();
    this.loadSucursales();
  }

  loadMenus() {
    this.loading = true;
    this.menusService
      .getMenus()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data) => {
          this.menus = data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error cargando menús', err),
      });
  }

  loadSucursales() {
    this.sucursalesService.getSucursales().subscribe({
      next: (data) => {
        this.sucursales = data;
        this.cdr.detectChanges();
      },
    });
  }

  getSucursalName(id: string): string {
    const s = this.sucursales.find((x) => x.id === id);
    return s ? s.nombre : 'Desconocida';
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentMenu = {
      nombre: '',
      sucursalId: '',
      isActive: true,
      moneda: 'USD',
    };
    this.showModal = true;
  }

  openEditModal(menu: Menu) {
    this.isEditing = true;
    this.currentMenu = { ...menu };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentMenu = {};
  }

  saveMenu() {
    this.saving = true;
    const request =
      this.isEditing && this.currentMenu.id
        ? this.menusService.updateMenu(this.currentMenu.id, this.currentMenu)
        : this.menusService.createMenu(this.currentMenu);

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.uiService.showToast(
          '¡Éxito!',
          'Menú guardado correctamente.',
          'success',
        );
        this.closeModal();
        this.loadMenus();
      },
      error: (err) => {
        console.error('Error guardando', err);
        this.uiService.showToast(
          'Error',
          'Ocurrió un error al guardar el menú.',
          'error',
        );
      },
    });
  }

  deleteMenu(id: string) {
    this.uiService.showConfirm({
      title: 'Eliminar Menú',
      message:
        '¿Estás seguro de que deseas eliminar este menú? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      onConfirm: () => {
        this.menusService.deleteMenu(id).subscribe({
          next: () => {
            this.uiService.showToast(
              '¡Eliminado!',
              'El menú fue eliminado.',
              'success',
            );
            this.loadMenus();
          },
          error: (err) =>
            this.uiService.showToast(
              'Error',
              'No se pudo eliminar el menú. Puede que tenga categorías activas.',
              'error',
            ),
        });
      },
    });
  }

  async generateQr(menu: Menu) {
    this.currentMenuForQr = menu;
    // Intentar detectar la IP si no estamos en localhost
    if (window.location.hostname !== 'localhost') {
      this.baseIp = window.location.hostname;
    }
    await this.updateQrImage();
    this.qrMenuName = menu.nombre;
    this.showQrModal = true;
    this.cdr.detectChanges();
  }

  async updateQrImage() {
    if (!this.currentMenuForQr) return;
    const url = `http://${this.baseIp}:4200/carta/${this.currentMenuForQr.id}?sucursal=${this.currentMenuForQr.sucursalId}`;
    try {
      this.qrCodeUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      this.cdr.detectChanges();
    } catch (err) {
      this.uiService.showToast(
        'Error',
        'No se pudo generar el código QR',
        'error',
      );
    }
  }

  closeQrModal() {
    this.showQrModal = false;
    this.qrCodeUrl = '';
    this.qrMenuName = '';
  }

  downloadQr() {
    if (!this.qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = this.qrCodeUrl;
    a.download = `QR_Menu_${this.qrMenuName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.uiService.showToast(
      'Descarga iniciada',
      'El código QR se ha descargado',
      'success',
    );
  }
}
