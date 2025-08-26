import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SupabaseService, User } from '../../../core/services/supabase.service';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { DropdownModule } from 'primeng/dropdown';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { MenuItem } from 'primeng/api';
import { TranslationLoaderService } from '../../../core/services/TranslationLoaderService';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    MenuModule,
    DropdownModule,
    TieredMenuModule,
    TranslateModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  languages = [
    { label: 'English', value: 'en' },
    { label: 'हिंदी', value: 'hi' },
    { label: 'मराठी', value: 'mr' }
  ];
  selectedLanguage = { label: 'English', value: 'en' };
  userMenuItems: MenuItem[] = [];
  // Observable of current user (will be null on SSR)
  currentUser$ = this.supabase?.getCurrentUser();
  currentUser: User | null = null;

  private isBrowser: boolean;


  constructor(
    private translateService: TranslateService,
    private translationLoader: TranslationLoaderService,
    private readonly supabase: SupabaseService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.currentUser$?.subscribe(user => {
      this.currentUser = user;
      // Update UI based on user state
    });
    this.translationLoader.getTranslation(this.selectedLanguage.value).subscribe(
      translations => {
        this.translateService.setTranslation(this.selectedLanguage.value, translations, true);
        this.translateService.use(this.selectedLanguage.value);

      });
    // Only setup user menu if running in browser
    if (this.isBrowser) {
      this.userMenuItems = [
        { label: 'Profile', icon: 'pi pi-user', command: () => { } },
        { label: 'Settings', icon: 'pi pi-cog', command: () => { } },
        { separator: true },
        {
          label: 'Sign Out',
          icon: 'pi pi-sign-out',
          command: () => this.signOut()
        }
      ];
    }
    console.log(this.currentUser$);
    debugger
  }

  formatTime(seconds: number | null): string {
    if (!seconds || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  onLanguageChange(event: any) {
    const selectedLang = event?.value ?? event?.value?.value ?? 'en';
    this.translationLoader.getTranslation(selectedLang).subscribe(
      translations => {
        this.translateService.setTranslation(selectedLang, translations, true);
        this.translateService.use(selectedLang);
        this.selectedLanguage = event;
      },
      error => {
        console.error('Error loading translation:', error);
        this.translateService.use('en');
        this.selectedLanguage = this.languages[0];
      }
    );
  }

  async signOut() {
    if (this.isBrowser) {
      await this.supabase.signOut();
    }
  }

  toggleHighContrast() {
    if (this.isBrowser) {
      document.body.classList.toggle('high-contrast');
    }
  }

  increaseFontSize() {
    if (this.isBrowser) {
      const currentSize = parseInt(getComputedStyle(document.body).fontSize);
      document.body.style.fontSize = `${currentSize + 2}px`;
    }
  }

  decreaseFontSize() {
    if (this.isBrowser) {
      const currentSize = parseInt(getComputedStyle(document.body).fontSize);
      document.body.style.fontSize = `${currentSize - 2}px`;
    }
  }
}
