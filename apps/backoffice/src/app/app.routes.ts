import { Route } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'carta/:id',
    loadComponent: () => import('./features/public-menu/public-menu.component').then(m => m.PublicMenuComponent)
  },
  {
    path: 'mesa/:id',
    loadComponent: () => import('./features/public-menu/public-menu.component').then(m => m.PublicMenuComponent)
  },
  {
    path: 'carta',
    loadComponent: () => import('./features/public-menu/public-menu.component').then(m => m.PublicMenuComponent)
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'mesas',
        loadComponent: () => import('./features/mesas/mesas.component').then(m => m.MesasComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'sucursales',
        loadComponent: () => import('./features/sucursales/sucursales.component').then(m => m.SucursalesComponent)
      },
      {
        path: 'menus',
        loadComponent: () => import('./features/menus/menus.component').then(m => m.MenusComponent)
      },
      {
        path: 'menus/:id',
        loadComponent: () => import('./features/menus/menu-detail/menu-detail.component').then(m => m.MenuDetailComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
