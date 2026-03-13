import { Injectable, Inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Strong typing for announcements
export interface Announcement {
  id?: string;
  title: string;
  content: string;
  is_active?: boolean;
  priority?: number;
  start_date?: string;  // ISO string
  end_date?: string | null;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementsService {
  private readonly table = 'pwd_announcements';

  constructor(@Inject(SupabaseClient) private supabase: SupabaseClient) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
  }

  /** Fetch all announcements (admin can see all, public will get only active ones per RLS) */
  getAll(): Observable<Announcement[]> {
    return from(
      this.supabase
        .from(this.table)
        .select('*')
        .order('priority', { ascending: false })
        .order('start_date', { ascending: false })
    ).pipe(map(res => {
      if (res.error) throw res.error;
      return res.data ?? [];
    }));
  }

  /** Create a new announcement */
  create(announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>): Observable<Announcement> {
    return from(
      this.supabase
        .from(this.table)
        .insert([announcement])
        .select()
        .single()
    ).pipe(map(res => {
      if (res.error) throw res.error;
      return res.data!;
    }));
  }

  /** Update an existing announcement */
  update(id: string, updates: Partial<Announcement>): Observable<Announcement> {
    return from(
      this.supabase
        .from(this.table)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    ).pipe(map(res => {
      if (res.error) throw res.error;
      return res.data!;
    }));
  }

  /** Delete an announcement */
  delete(id: string): Observable<void> {
    return from(
      this.supabase
        .from(this.table)
        .delete()
        .eq('id', id)
    ).pipe(map(res => {
      if (res.error) throw res.error;
      return;
    }));
  }
}
