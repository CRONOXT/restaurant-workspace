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
  sesionId?: string;
  comensalId?: string;
  esCompartido: boolean;
  items: PedidoItem[];
  estado: EstadoPedido;
  total: number;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  comensal?: {
    id: string;
    nombre: string;
    esLider: boolean;
  };
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

  crearPedido(
    mesaId: string,
    items: PedidoItem[],
    notas?: string,
    sesionId?: string,
    comensalId?: string,
    esCompartido: boolean = false
  ): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, {
      mesaId,
      items,
      notas,
      sesionId,
      comensalId,
      esCompartido
    });
  }

  getPedidosPorMesa(mesaId: string, estado?: EstadoPedido): Observable<Pedido[]> {
    let url = `${this.apiUrl}/mesa/${mesaId}`;
    if (estado) {
      url += `?estado=${estado}`;
    }
    return this.http.get<Pedido[]>(url);
  }

  getPedidosPorSesion(sesionId: string, comensalId?: string): Observable<Pedido[]> {
    let url = `${this.apiUrl}/sesion/${sesionId}`;
    if (comensalId) {
      url += `?comensalId=${comensalId}`;
    }
    return this.http.get<Pedido[]>(url);
  }

  getPedidos(sucursalId?: string, estado?: EstadoPedido, search?: string, page?: number, limit?: number): Observable<{ data: Pedido[], total: number }> {
    let params: any = {};
    if (sucursalId) params.sucursalId = sucursalId;
    if (estado) params.estado = estado;
    if (search) params.search = search;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    
    return this.http.get<{ data: Pedido[], total: number }>(this.apiUrl, { params });
  }

  getPedido(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
  }

  actualizarEstado(id: string, estado: EstadoPedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${id}/estado`, { estado });
  }
}
