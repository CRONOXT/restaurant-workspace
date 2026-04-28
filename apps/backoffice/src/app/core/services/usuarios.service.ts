import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id?: string;
  email: string;
  password?: string;
  nombre: string;
  rol: 'ADMIN' | 'GERENTE' | 'CAMARERO';
  sucursalId?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuario`;

  getUsuarios(search?: string, page?: number, limit?: number): Observable<{ data: Usuario[], total: number }> {
    let params: any = {};
    if (search) params.search = search;
    if (page) params.page = page;
    if (limit) params.limit = limit;

    return this.http.get<{ data: Usuario[], total: number }>(this.apiUrl, { params });
  }

  getUsuario(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
  }

  createUsuario(data: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, data);
  }

  updateUsuario(id: string, data: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, data);
  }

  deleteUsuario(id: string): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.apiUrl}/${id}`);
  }
}
