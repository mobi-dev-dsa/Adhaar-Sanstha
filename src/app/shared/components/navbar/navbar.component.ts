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
    TranslateModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  languages = [
    { label: 'English', value: 'en' },
    { label: 'हिंदी', value: 'hi' },
    { label: 'मराठी', value: 'mr' },
  ];
  selectedLanguage = { label: 'English', value: 'en' };
  userMenuItems: MenuItem[] = [];
  currentUser$ = this.supabase?.getCurrentUser();
  currentUser: User | null = null;
  mobileOpen = false;
  isHighContrast = false;
  languageChangeAnnouncement = '';

  private isBrowser: boolean;
  private readonly MIN_FONT_SIZE = 12;
  private readonly MAX_FONT_SIZE = 24;
  private readonly FONT_STEP = 2;

  constructor(
    private translateService: TranslateService,
    private translationLoader: TranslationLoaderService,
    private readonly supabase: SupabaseService,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    console.log('NavbarComponent initialized:', PLATFORM_ID);
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.currentUser$?.subscribe((user) => {
      this.currentUser = user;
    });

    this.translationLoader
      .getTranslation(this.selectedLanguage.value)
      .subscribe((translations) => {
        this.translateService.setTranslation(
          this.selectedLanguage.value,
          translations,
          true,
        );
        this.translateService.use(this.selectedLanguage.value);
      });

    if (this.isBrowser) {
      this.userMenuItems = [
        { label: 'Profile', icon: 'pi pi-user', command: () => {} },
        { label: 'Settings', icon: 'pi pi-cog', command: () => {} },
        { separator: true },
        {
          label: 'Sign Out',
          icon: 'pi pi-sign-out',
          command: () => this.signOut(),
        },
      ];

      // Restore persisted accessibility preferences
      const savedFontSize = localStorage.getItem('font-size');
      if (savedFontSize) {
        document.documentElement.style.fontSize = `${savedFontSize}px`;
      }

      if (localStorage.getItem('high-contrast') === 'true') {
        document.body.classList.add('high-contrast');
        this.isHighContrast = true;
      }
    }
  }

  formatTime(seconds: number | null): string {
    if (!seconds || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  onLanguageChange(event: any) {
    const selectedLang = event?.value ?? event?.value?.value ?? 'en';
    this.translationLoader.getTranslation(selectedLang).subscribe(
      (translations) => {
        this.translateService.setTranslation(selectedLang, translations, true);
        this.translateService.use(selectedLang);
        this.selectedLanguage = event;

        // WCAG 3.1.1 — update html[lang] to match selected language
        if (this.isBrowser) {
          document.documentElement.setAttribute('lang', selectedLang);
        }

        // WCAG 3.2.2 — announce language change to screen readers
        const langLabel =
          this.languages.find((l) => l.value === selectedLang)?.label ??
          selectedLang;
        this.languageChangeAnnouncement = `Language changed to ${langLabel}`;
        setTimeout(() => (this.languageChangeAnnouncement = ''), 3000);
      },
      (error) => {
        console.error('Error loading translation:', error);
        this.translateService.use('en');
        this.selectedLanguage = this.languages[0];
      },
    );
  }

  async signOut() {
    if (this.isBrowser) {
      await this.supabase.signOut();
    }
  }

  toggleHighContrast() {
    if (this.isBrowser) {
      // WCAG 4.1.2 — track state for aria-pressed on the button
      this.isHighContrast = document.body.classList.toggle('high-contrast');
      localStorage.setItem(
        'high-contrast',
        this.isHighContrast ? 'true' : 'false',
      );
    }
  }

  increaseFontSize() {
    if (this.isBrowser) {
      // Use html (documentElement) — rem units scale off html, not body
      const current = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const next = Math.min(current + this.FONT_STEP, this.MAX_FONT_SIZE);
      document.documentElement.style.fontSize = `${next}px`;
      localStorage.setItem('font-size', String(next));
    }
  }

  decreaseFontSize() {
    if (this.isBrowser) {
      const current = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      const next = Math.max(current - this.FONT_STEP, this.MIN_FONT_SIZE);
      document.documentElement.style.fontSize = `${next}px`;
      localStorage.setItem('font-size', String(next));
    }
  }
}
