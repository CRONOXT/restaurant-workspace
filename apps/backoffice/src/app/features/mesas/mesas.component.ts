import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { MesasService, Mesa } from '../../core/services/mesas.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.css']
})
export class MesasComponent implements OnInit {
  private mesasService = inject(MesasService);
  mesas: Mesa[] = [];
  loading = true;
  selectedMesaQr: string | null = null;
  selectedMesaNumber: number | null = null;

  // En producción, esto debería venir de las variables de entorno
  baseUrl = 'http://localhost:4200/mesa/';

  ngOnInit() {
    this.baseUrl = `http://${window.location.hostname}:4200/mesa/`;
    this.loadMesas();
  }

  loadMesas() {
    this.loading = true;
    this.mesasService.getMesas()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => this.mesas = data,
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

  showQr(mesa: Mesa) {
    this.selectedMesaQr = this.baseUrl + mesa.qrCode;
    this.selectedMesaNumber = mesa.numero;
  }

  closeQr() {
    this.selectedMesaQr = null;
    this.selectedMesaNumber = null;
  }
}
