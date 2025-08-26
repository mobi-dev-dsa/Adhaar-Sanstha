// role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map, of, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const expectedRoles = route.data?.['expectedRoles'] as string[];
    
    if (!expectedRoles || expectedRoles.length === 0) {
      return of(true); // No role restrictions
    }

    return this.supabaseService.getCurrentUser().pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        const userRole = user.role_name?.toLowerCase();
        const hasAccess = expectedRoles.some(role => 
          role.toLowerCase() === userRole
        );

        if (!hasAccess) {
          // Redirect to appropriate page based on user's role
          this.redirectToDefaultRoute(userRole);
          return false;
        }

        return true;
      })
    );
  }

  private redirectToDefaultRoute(userRole: string | undefined) {
    switch (userRole) {
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