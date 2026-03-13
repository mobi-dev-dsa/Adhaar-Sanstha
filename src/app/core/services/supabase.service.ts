import { Inject, Injectable } from '@angular/core';
import { AuthResponse, SupabaseClient, } from '@supabase/supabase-js';
import { BehaviorSubject, catchError, from, map, Observable, of, switchMap, take } from 'rxjs';
import { Router } from '@angular/router';

// Enhanced interfaces with proper typing
export enum DisabilityType {
  VISUAL = 'visual',
  HEARING = 'hearing',
  PHYSICAL = 'physical',
  INTELLECTUAL = 'intellectual',
  MENTAL_HEALTH = 'mental_health',
  MULTIPLE = 'multiple',
  ACID_ATTACK = 'acid_attack',
  AUTISM = 'autism'
}

export enum SeverityLevel {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  PROFOUND = 'profound'
}

export enum DisabilityDueTo {
  ACCIDENTAL = 'accidental',
  CONGENITAL = 'congenital',
  DISEASE = 'disease',
  INFECTION = 'infection',
  OTHER = 'other'
}

export enum EducationLevel {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  HIGHER_SECONDARY = 'higher_secondary',
  GRADUATE = 'graduate',
  POST_GRADUATE = 'post_graduate',
  NONE = 'none'
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string; // ISO format
  gender: string;
}

export interface DisabilityInfo {
  type: DisabilityType;
  severity: SeverityLevel;
  disability_percentage: number;
  // additional fields may be added as needed
  disability_by_birth: boolean;

}

export interface EducationInfo {
  level: EducationLevel;
  institution?: string;
  year_completed?: string;
}

export interface AddressInfo {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PWDRegistration {
  id?: string;
  personal_info: PersonalInfo;
  disability_info: DisabilityInfo;
  education: EducationInfo;
  skills: string[];
  address: AddressInfo;
  government_id_url?: string;
  documents?: {
    aadhar_number?: string;
    has_uuid?: boolean;
    uuid_number?: string;
    uuid_certificate_url?: string;
    disability_certificate_url?: string;
  };
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
          this.currentUser.next(session.user as unknown as User);
        }
      } else {
        this.currentUser.next(null);
      }
    });
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable().pipe(
      switchMap(authUser => {
        if (!authUser) {
          return of(null);
        }
        if (authUser.first_name && authUser.role_name) {
          return of(authUser);
        }
        return from(this.getUserWithRoleDetails(authUser.id)).pipe(
          catchError(error => {
            console.error('Error fetching user details:', error);
            return of(authUser);
          })
        );
      })
    );
  }

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
        role_name: data.pwd_roles?.role_name
      };

      return userData;
    } catch (error) {
      console.error('Error in getUserWithRoleDetails:', error);
      throw error;
    }
  }

  async checkEmailAvailable(email: string): Promise<boolean> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!this.supabase) {
        console.warn('⚠️ Supabase client not available (SSR mode)');
        return true;
      }

      const { data, error } = await this.supabase
        .from('pwd_users')
        .select('email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error) {
        console.error('Error checking email availability:', error);
        return true;
      }

      return data === null;
    } catch (error) {
      console.error('Exception in checkEmailAvailable:', error);
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
      this.router.navigate(['/auth/login']);
    }
  }

  async signUp(payload: RegisterPayload, roleId: number = 2): Promise<AuthResponse> {
    if (!this.supabase) throw new Error('Supabase client is not initialized');

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

  setCurrentUser(user: User | null) {
    this.currentUser.next(user);
  }

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