// src/app/core/supabase-init.ts
import { APP_INITIALIZER, Provider, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

let supabase: SupabaseClient | null = null;

export function initSupabase(platformId: Object) {
    return () => {
        if (isPlatformBrowser(platformId)) {
            console.log('✅ Initializing Supabase in browser...');
            supabase = createClient(environment.supabaseUrl, environment.supabaseKey,{
                auth: {
                    autoRefreshToken: false,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });
        } else {
            console.log('⚠️ Skipping Supabase init (server-side)');
        }
    };
}

export function getSupabase(): SupabaseClient | null {
    return supabase;
}

export const SUPABASE_PROVIDERS: Provider[] = [
    {
        provide: APP_INITIALIZER,
        useFactory: initSupabase,
        deps: [PLATFORM_ID],   // ✅ inject PLATFORM_ID properly
        multi: true
    },
    {
        provide: SupabaseClient,
        useFactory: getSupabase
    }
];
