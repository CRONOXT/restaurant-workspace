import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService, ToastMessage, ConfirmConfig } from '../../../core/services/ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ui-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-container.component.html',
  styleUrls: ['./ui-container.component.css']
})
export class UiContainerComponent implements OnInit, OnDestroy {
  private uiService = inject(UiService);
  private cdr = inject(ChangeDetectorRef);
  
  toasts: ToastMessage[] = [];
  confirmConfig: ConfirmConfig | null = null;
  
  private subs: Subscription = new Subscription();

  ngOnInit() {
    this.subs.add(
      this.uiService.toasts$.subscribe(toast => {
        this.toasts.push(toast);
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.removeToast(toast.id);
        }, toast.duration);
      })
    );

    this.subs.add(
      this.uiService.confirm$.subscribe(config => {
        this.confirmConfig = config;
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }

  onConfirm() {
    if (this.confirmConfig) {
      this.confirmConfig.onConfirm();
    }
    this.uiService.closeConfirm();
  }

  onCancel() {
    this.uiService.closeConfirm();
  }
}
