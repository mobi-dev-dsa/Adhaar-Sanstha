import { Inject, Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  AuthResponse,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,

} from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, catchError, from, map, Observable, of, switchMap, take } from 'rxjs';
import { Router } from '@angular/router';

export interface PWDRegistration {
  id?: string;
  personal_info: {
    name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: string;
  };
  disability_info: {
    type: string;
    severity: string;
    diagnosis_date: string;
  };
  education: {
    level: string;
    institution: string;
    year_completed: string;
  };
  skills: string[];
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  government_id_url?: string;
  created_at?: string;
  updated_at?: string;
}
export interface RegisterPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobile?: string;
  password: string;
}
export interface User {
  id: string;
  email?: string;
  user_id?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  mobile?: string;
  role_id?: number;
  role_name?: string;
  created_at?: string;
  updated_at?: string;
}
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  // private sessionTimer: any;
  // private sessionExpiresIn = new BehaviorSubject<number>(0); // default 0
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor(@Inject(SupabaseClient) private supabase: SupabaseClient | null, private router: Router) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not initialized (SSR mode)');
      return;
    }

    console.log('✅ SupabaseService constructed');
    this.initializeAuth();
  }

  private async initializeAuth() {
    if (!this.supabase) {
      console.warn('⚠️ Supabase client not available (SSR mode)');
      return;
    }

    const { data } = await this.supabase.auth.getSession();
    const session = data?.session ?? null;

    if (session?.user) {
      const userWithDetails = await this.getUserWithRoleDetails(session.user.id);
      this.currentUser.next(userWithDetails);
    } else {
      this.currentUser.next(null);
    }



    this.supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const userWithDetails = await this.getUserWithRoleDetails(session.user.id);
          this.currentUser.next(userWithDetails);
        } catch (error) {
          console.error('Error fetching user details in auth state change:', error);
          // Still set the basic user if details fetch fails
          this.currentUser.next(session.user as unknown as User);
        }
      } else {
        this.currentUser.next(null);
      }
      // if (this.sessionTimer) {
      //   clearTimeout(this.sessionTimer);
      // }
    });
  }

  // Enhanced getCurrentUser method with role details
  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable().pipe(
      switchMap(authUser => {
        if (!authUser) {
          return of(null);
        }
        // If we already have the extended user data, return it
        if (authUser.first_name && authUser.role_name) {
          return of(authUser);
        }
        // Otherwise fetch the complete user details
        return from(this.getUserWithRoleDetails(authUser.id)).pipe(
          catchError(error => {
            console.error('Error fetching user details:', error);
            return of(authUser); // Return basic auth user if details fetch fails
          })
        );
      })
    );
  }

  // Helper method to get user with role details
  // Helper method to get user with role details
  private async getUserWithRoleDetails(userId: string): Promise<User | null> {
    try {
      if (!this.supabase) throw new Error('Supabase client not initialized');

      const { data, error } = await this.supabase
        .from('pwd_users')
        .select(`
        *,
        pwd_roles:role_id (role_name)
      `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user:', error);
        throw error;
      }

      if (!data) {
        console.log('No user found with ID:', userId);
        return null;
      }

      const userData: User = {
        id: data.user_id,
        email: data.email,
        role_id: data.role_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        first_name: data.first_name,
        middle_name: data.middle_name || undefined,
        last_name: data.last_name,
        mobile: data.mobile,
        role_name: data.pwd_roles?.role_name // Access joined role data
      };

      return userData;
    } catch (error) {
      console.error('Error in getUserWithRoleDetails:', error);
      throw error;
    }
  }

  // Check if email is available (not already registered)
  async checkEmailAvailable(email: string): Promise<boolean> {
    try {
      // Sanitize email
      const cleanEmail = email.trim().toLowerCase();
      if (!this.supabase) {
        console.warn('⚠️ Supabase client not available (SSR mode)');
        return true; // Don't block registration if Supabase not available
      }
      // Check if email exists in your users table
      const { data, error } = await this.supabase
        .from('pwd_users') // Replace with your actual table name
        .select('email')
        .eq('email', cleanEmail)
        .maybeSingle(); // Returns null if no record found

      if (error) {
        console.error('Error checking email availability:', error);
        // Don't block registration if check fails - assume email is available
        return true;
      }

      return data === null;
    } catch (error) {
      console.error('Exception in checkEmailAvailable:', error);
      // Don't block registration on error - assume email is available
      return true;
    }
  }
  async signOut(redirect = false): Promise<void> {
    if (!this.supabase) {
      console.warn('⚠️ Supabase client not available (SSR mode)');
      return;
    }
    await this.supabase.auth.signOut();
    this.currentUser.next(null);

    if (redirect) {
      this.router.navigate(['/auth/login']); // 👈 redirect to login
    }
  }

  async signUp(payload: RegisterPayload, roleId: number = 2): Promise<AuthResponse> {
    if (!this.supabase) throw new Error('Supabase client is not initialized');

    // Step 1: create auth user
    const { data, error } = await this.supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;

    const user = data.user;
    if (user) {
      // Step 2: insert profile row in pwd_users
      const { error: insertError } = await this.supabase
        .from('pwd_users')
        .insert({
          user_id: user.id,
          email: payload.email,
          role_id: roleId,
          first_name: payload.firstName,
          middle_name: payload.middleName ?? null,
          last_name: payload.lastName,
          mobile: payload.mobile ?? null,

          // created_at / updated_at default via DB
        });

      if (insertError) {
        console.error('❌ Failed to insert user profile:', insertError.message);
        throw insertError;
      }
    }

    return { data, error };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized');
    }
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  // Set current user in BehaviorSubject
  setCurrentUser(user: User | null) {
    this.currentUser.next(user);
  }

  // Resend verification email (magic link)
  async resendConfirmation(email: string) {
    if (!this.supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await this.supabase.auth.signInWithOtp({ email });
    return { data, error };
  }

  hasRole(expectedRole: string): Observable<boolean> {
    return this.getCurrentUser().pipe(
      take(1),
      map(user => user?.role_name?.toLowerCase() === expectedRole.toLowerCase())
    );
  }

  hasAnyRole(expectedRoles: string[]): Observable<boolean> {
    return this.getCurrentUser().pipe(
      take(1),
      map(user => expectedRoles.some(role =>
        role.toLowerCase() === user?.role_name?.toLowerCase()
      ))
    );
  }
  // ===================
  // Storage methods
  // ===================
  async uploadFile(file: File, path: string): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized');
    }
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await this.supabase.storage
      .from('pwd-documents')
      .upload(`${path}/${fileName}`, file);

    if (error) throw error;

    const { data } = this.supabase.storage
      .from('pwd-documents')
      .getPublicUrl(`${path}/${fileName}`);

    return data.publicUrl;
  }

  // ===================
  // Database methods
  // ===================
  async createPWDRegistration(data: PWDRegistration): Promise<PWDRegistration> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized');
    }
    const { data: result, error } = await this.supabase
      .from('pwd_registrations')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async getPWDRegistrations(): Promise<PWDRegistration[]> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized');
    }
    const { data, error } = await this.supabase
      .from('pwd_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async updatePWDRegistration(id: string, data: Partial<PWDRegistration>): Promise<PWDRegistration> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized');
    }
    const { data: result, error } = await this.supabase
      .from('pwd_registrations')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deletePWDRegistration(id: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized');
    }
    const { error } = await this.supabase
      .from('pwd_registrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
