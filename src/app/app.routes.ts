import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/components/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/components/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'pwd',
    children: [
      {
        path: 'register',
        loadComponent: () => import('./pwd/components/pwd-registration/pwd-registration.component').then(m => m.PwdRegistrationComponent)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadComponent: () => import('./admin/components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'programs',
    loadComponent: () => import('./programs/components/programs-list/programs-list.component').then(m => m.ProgramsListComponent)
  },
  {
    path: 'schemes',
    loadComponent: () => import('./schemes/components/schemes-list/schemes-list.component').then(m => m.SchemesListComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
