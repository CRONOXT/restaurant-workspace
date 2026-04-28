import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private socket: Socket;

  constructor(private ngZone: NgZone) {
    // Tomamos el origen del entorno y extraemos host/port de la API.
    const url = new URL(environment.apiUrl);
    const serverUrl = url.protocol + '//' + url.host;
    this.socket = io(serverUrl, {
      autoConnect: false
    });
  }

  connect(sucursalId: string) {
    if (!this.socket.connected) {
      this.socket.connect();
    }
    
    // Evitamos acumular listeners si se navega varias veces
    this.socket.off('connect');

    // Ensures we emit whenever we connect/reconnect
    this.socket.on('connect', () => {
      console.log('🔗 WebSocket Connected to server. Joining sucursal:', sucursalId);
      this.socket.emit('joinSucursal', sucursalId);
    });
    
    // Fallback if it's already connected
    if (this.socket.connected) {
      this.socket.emit('joinSucursal', sucursalId);
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  onTableOccupied(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('tableOccupied', (data) => {
        this.ngZone.run(() => observer.next(data));
      });
      return () => this.socket.off('tableOccupied');
    });
  }

  onTableFreed(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('tableFreed', (data) => {
        this.ngZone.run(() => observer.next(data));
      });
      return () => this.socket.off('tableFreed');
    });
  }

  onNewOrder(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('newOrder', (data) => {
        this.ngZone.run(() => observer.next(data));
      });
      return () => this.socket.off('newOrder');
    });
  }

  onOrderStatusChanged(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('orderStatusChanged', (data) => {
        this.ngZone.run(() => observer.next(data));
      });
      return () => this.socket.off('orderStatusChanged');
    });
  }
}

