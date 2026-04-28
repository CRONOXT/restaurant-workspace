import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Comensal {
  id: string;
  sesionId: string;
  nombre: string;
  token: string;
  esLider: boolean;
  createdAt: string;
}

export interface Sesion {
  id: string;
  mesaId: string;
  codigo: string;
  isActive: boolean;
  cierreSolicitado: boolean;
  comensales: Comensal[];
  createdAt: string;
  closedAt?: string;
  mesa?: any;
}

export interface CuentaComensal {
  id: string;
  nombre: string;
  esLider: boolean;
  pedidos: any[];
  subtotal: number;
  parteCompartida: number;
  totalAPagar: number;
}

export interface DesgloseCuentas {
  sesionId: string;
  mesa: { id: string; numero: number };
  comensales: CuentaComensal[];
  compartidos: {
    pedidos: any[];
    total: number;
    porPersona: number;
  };
  totalMesa: number;
}

@Injectable({
  providedIn: 'root'
})
export class SesionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sesion`;

  crearSesion(mesaId: string, nombreLider: string): Observable<{ sesion: Sesion; comensal: Comensal; token: string }> {
    return this.http.post<any>(`${this.apiUrl}/crear`, { mesaId, nombreLider });
  }

  unirseASesion(codigo: string, nombre: string): Observable<{ sesion: Sesion; comensal: Comensal; token: string }> {
    return this.http.post<any>(`${this.apiUrl}/unirse`, { codigo, nombre });
  }

  getSesionActiva(mesaId: string): Observable<Sesion | null> {
    return this.http.get<Sesion | null>(`${this.apiUrl}/mesa/${mesaId}/activa`);
  }

  getSesion(id: string): Observable<Sesion> {
    return this.http.get<Sesion>(`${this.apiUrl}/${id}`);
  }

  getComensalByToken(token: string): Observable<Comensal | null> {
    return this.http.get<Comensal | null>(`${this.apiUrl}/comensal/token/${token}`);
  }

  getCuentas(sesionId: string): Observable<DesgloseCuentas> {
    return this.http.get<DesgloseCuentas>(`${this.apiUrl}/${sesionId}/cuentas`);
  }

  cerrarSesion(sesionId: string): Observable<Sesion> {
    return this.http.put<Sesion>(`${this.apiUrl}/${sesionId}/cerrar`, {});
  }

  solicitarCierre(sesionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<any>(`${this.apiUrl}/${sesionId}/solicitar-cierre`, {});
  }

  rechazarCierre(sesionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<any>(`${this.apiUrl}/${sesionId}/rechazar-cierre`, {});
  }
}
