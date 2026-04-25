import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UiContainerComponent } from '../../shared/components/ui-container/ui-container.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, UiContainerComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  authService = inject(AuthService);
  
  allMenuItems = [
    { label: 'Dashboard', icon: 'bi bi-house-door', route: '/dashboard' },
    { label: 'Sucursales', icon: 'bi bi-building', route: '/sucursales', roles: ['ADMIN', 'GERENTE'] },
    { label: 'Mesas', icon: 'bi bi-grid-3x3-gap', route: '/mesas', roles: ['CAMARERO', 'GERENTE'] },
    { label: 'Menús', icon: 'bi bi-journal-text', route: '/menus', roles: ['ADMIN', 'GERENTE'] },
    { label: 'Usuarios', icon: 'bi bi-people', route: '/usuarios', roles: ['ADMIN', 'GERENTE'] },
  ];

  menuItems: any[] = [];

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.menuItems = this.allMenuItems.filter(item => {
          if (!item.roles) return true;
          return item.roles.includes(user.rol);
        });
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
