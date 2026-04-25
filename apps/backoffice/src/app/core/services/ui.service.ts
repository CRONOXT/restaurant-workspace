import { Injectable, NgZone } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private toastsSubject = new Subject<ToastMessage>();
  private confirmSubject = new Subject<ConfirmConfig | null>();

  public toasts$ = this.toastsSubject.asObservable();
  public confirm$ = this.confirmSubject.asObservable();

  constructor(private ngZone: NgZone) {}

  showToast(title: string, message: string, type: ToastType = 'info', duration: number = 4000) {
    this.ngZone.run(() => {
      this.toastsSubject.next({
        id: Math.random().toString(36).substring(2, 9),
        type,
        title,
        message,
        duration
      });
    });
  }

  showConfirm(config: ConfirmConfig) {
    this.confirmSubject.next(config);
  }

  closeConfirm() {
    this.confirmSubject.next(null);
  }
}
