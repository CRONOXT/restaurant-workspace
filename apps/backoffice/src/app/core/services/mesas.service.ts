import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  qrCode: string;
  isActive: boolean;
  sucursalId: string;
  isOccupied?: boolean;
  pedidosActivos?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class MesasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/mesa`;

  getMesas(search?: string, page?: number, limit?: number, sucursalId?: string): Observable<{ data: Mesa[], total: number }> {
    let params: any = {};
    if (search) params.search = search;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (sucursalId) params.sucursalId = sucursalId;

    return this.http.get<{ data: Mesa[], total: number }>(this.apiUrl, { params });
  }

  getMesa(id: string): Observable<Mesa> {
    return this.http.get<Mesa>(`${this.apiUrl}/${id}`);
  }

  createMesa(mesa: Partial<Mesa>): Observable<Mesa> {
    // Generate a unique identifier for QR Code initially if not provided
    if (!mesa.qrCode) {
      mesa.qrCode = crypto.randomUUID();
    }
    return this.http.post<Mesa>(this.apiUrl, mesa);
  }

  updateMesa(id: string, mesa: Partial<Mesa>): Observable<Mesa> {
    return this.http.put<Mesa>(`${this.apiUrl}/${id}`, mesa);
  }

  freeMesa(id: string): Observable<Mesa> {
    return this.http.put<Mesa>(`${this.apiUrl}/${id}/free`, {});
  }

  occupyMesa(id: string): Observable<Mesa> {
    return this.http.put<Mesa>(`${this.apiUrl}/${id}/occupy`, {});
  }

  deleteMesa(id: string): Observable<Mesa> {
    return this.http.delete<Mesa>(`${this.apiUrl}/${id}`);
  }
}
