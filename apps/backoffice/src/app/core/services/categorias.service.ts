import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen?: string | null;
  disponible: boolean;
  categoriaId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  menuId: string;
  orden: number;
  productos?: Producto[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categoria`;

  getCategorias(menuId: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}?menuId=${menuId}`);
  }

  createCategoria(categoria: Partial<Categoria>): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, categoria);
  }

  updateCategoria(id: string, categoria: Partial<Categoria>): Observable<Categoria> {
    return this.http.put<Categoria>(`${this.apiUrl}/${id}`, categoria);
  }

  deleteCategoria(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
