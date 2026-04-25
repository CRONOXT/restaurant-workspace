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
}

@Injectable({
  providedIn: 'root'
})
export class MesasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/mesa`;

  getMesas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(this.apiUrl);
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

  deleteMesa(id: string): Observable<Mesa> {
    return this.http.delete<Mesa>(`${this.apiUrl}/${id}`);
  }
}
