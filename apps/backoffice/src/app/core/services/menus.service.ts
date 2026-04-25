import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Menu {
  id?: string;
  nombre: string;
  sucursalId: string;
  isActive?: boolean;
  moneda?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MenusService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/menu`;

  getMenus(): Observable<Menu[]> {
    return this.http.get<Menu[]>(this.apiUrl);
  }

  getMenu(id: string): Observable<Menu> {
    return this.http.get<Menu>(`${this.apiUrl}/${id}`);
  }

  createMenu(data: Partial<Menu>): Observable<Menu> {
    return this.http.post<Menu>(this.apiUrl, data);
  }

  updateMenu(id: string, data: Partial<Menu>): Observable<Menu> {
    return this.http.put<Menu>(`${this.apiUrl}/${id}`, data);
  }

  deleteMenu(id: string): Observable<Menu> {
    return this.http.delete<Menu>(`${this.apiUrl}/${id}`);
  }
}
