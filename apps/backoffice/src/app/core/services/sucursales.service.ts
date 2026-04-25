import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Sucursal {
  id?: string;
  nombre: string;
  direccion?: string;
  numeroMesas?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SucursalesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sucursal`;

  getSucursales(): Observable<Sucursal[]> {
    return this.http.get<Sucursal[]>(this.apiUrl);
  }

  getSucursal(id: string): Observable<Sucursal> {
    return this.http.get<Sucursal>(`${this.apiUrl}/${id}`);
  }

  createSucursal(data: Partial<Sucursal>): Observable<Sucursal> {
    return this.http.post<Sucursal>(this.apiUrl, data);
  }

  updateSucursal(id: string, data: Partial<Sucursal>): Observable<Sucursal> {
    return this.http.put<Sucursal>(`${this.apiUrl}/${id}`, data);
  }

  deleteSucursal(id: string): Observable<Sucursal> {
    return this.http.delete<Sucursal>(`${this.apiUrl}/${id}`);
  }
}
