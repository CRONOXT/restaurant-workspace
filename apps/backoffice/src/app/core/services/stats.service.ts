import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  ventasHoy: number;
  pedidosEnCurso: number;
  mesasOcupadas: number;
  mesasTotales: number;
  platosPopulares: { nombre: string; cantidad: number; total: number }[];
  ventasUltimaSemana: { fecha: string; total: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/stats`;

  getDashboardStats(sucursalId?: string): Observable<DashboardStats> {
    let params = new HttpParams();
    if (sucursalId) {
      params = params.set('sucursalId', sucursalId);
    }
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`, { params });
  }
}
