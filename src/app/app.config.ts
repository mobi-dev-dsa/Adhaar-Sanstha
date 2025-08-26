import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { SUPABASE_PROVIDERS } from './core/services/supabase-init';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(
      TranslateModule.forRoot({
        fallbackLang: 'en'
      })
    ),
        ...SUPABASE_PROVIDERS   // 👈 Supabase is initialized here
  ]
};
