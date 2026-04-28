import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PedidoItem {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export type EstadoPedido = 'PENDIENTE' | 'ACEPTADO' | 'ENTREGADO';

export interface Pedido {
  id: string;
  mesaId: string;
  items: PedidoItem[];
  estado: EstadoPedido;
  total: number;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  mesa?: {
    id: string;
    numero: number;
    sucursalId: string;
    sucursal?: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/pedido`;

  crearPedido(mesaId: string, items: PedidoItem[], notas?: string): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, { mesaId, items, notas });
  }

  getPedidosPorMesa(mesaId: string, estado?: EstadoPedido): Observable<Pedido[]> {
    let url = `${this.apiUrl}/mesa/${mesaId}`;
    if (estado) {
      url += `?estado=${estado}`;
    }
    return this.http.get<Pedido[]>(url);
  }

  getPedidos(sucursalId?: string, estado?: EstadoPedido): Observable<Pedido[]> {
    const params: string[] = [];
    if (sucursalId) params.push(`sucursalId=${sucursalId}`);
    if (estado) params.push(`estado=${estado}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<Pedido[]>(`${this.apiUrl}${query}`);
  }

  getPedido(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
  }

  actualizarEstado(id: string, estado: EstadoPedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${id}/estado`, { estado });
  }
}
