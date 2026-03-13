// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map, of, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService, 
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const expectedRole = route.data?.['expectedRole'];
    
    // If no role specified, allow all authenticated users
    if (!expectedRole) {
      return this.checkAuthentication();
    }

    // Check specific role access
    return this.checkRoleAccess(expectedRole);
  }

  private checkAuthentication() {
    return this.supabaseService.getCurrentUser().pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }
        return true;
      })
    );
  }

  private checkRoleAccess(expectedRole: string) {
    return this.supabaseService.getCurrentUser().pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return of(false);
        }

        // Check if user has the required role
        if (user.role_name?.toLowerCase() === expectedRole.toLowerCase()) {
          return of(true);
        }

        // Redirect based on user's actual role
        this.redirectBasedOnRole(user.role_name);
        return of(false);
      })
    );
  }

  private redirectBasedOnRole(userRole: string | undefined) {
    switch (userRole?.toLowerCase()) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'user':
        this.router.navigate(['/pwd/register']);
        break;
      default:
        this.router.navigate(['/']);
        break;
    }
  }
}