import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { DropdownModule } from 'primeng/dropdown';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { MenuItem } from 'primeng/api';
import { TranslationLoaderService } from '../../../core/services/TranslationLoaderService';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonModule, MenuModule, DropdownModule, TieredMenuModule, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  // currentUser$ = this.supabaseService.getCurrentUser();
  languages = [
    { label: 'English', value: 'en' },
    { label: 'हिंदी', value: 'hi' },
    { label: 'मराठी', value: 'mr' }
  ];
  selectedLanguage = { label: 'English', value: 'en' };
  userMenuItems: MenuItem[] = [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => { }
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => { }
    },
    {
      separator: true
    },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      // command: () => this.signOut()
      command: () => { }
    }
  ];

  constructor(
    private translateService: TranslateService,
    private translationLoader: TranslationLoaderService,

    // private supabaseService: SupabaseService
  ) { }

  ngOnInit() {
    const currentLang = this.translateService.currentLang || 'en';

    this.selectedLanguage = this.languages.find(lang =>
      lang.value === currentLang
    ) || this.languages[0];
  }

  onLanguageChange(event: any) {
    if (event && event.value) {
      const selectedLang = event.value;

      // Load translation file
      this.translationLoader.getTranslation(selectedLang).subscribe(
        (translations) => {
          // Add translations to the service
          this.translateService.setTranslation(selectedLang, translations, true);
          // Switch to the selected language
          this.translateService.use(selectedLang);
          this.selectedLanguage = event;
        },
        (error) => {
          console.error('Error loading translation:', error);
          // Fallback to English
          this.translateService.use('en');
          this.selectedLanguage = this.languages[0];
        }
      );
    } else if (event) {
      // Handle case where event is the selected language object directly
      const selectedLang = event.value;

      // Load translation file
      this.translationLoader.getTranslation(selectedLang).subscribe(
        (translations) => {
          // Add translations to the service
          this.translateService.setTranslation(selectedLang, translations, true);
          // Switch to the selected language
          this.translateService.use(selectedLang);
          this.selectedLanguage = event;
        },
        (error) => {
          console.error('Error loading translation:', error);
          // Fallback to English
          this.translateService.use('en');
          this.selectedLanguage = this.languages[0];
        }
      );
    }
  }
  // async signOut() {
  //   await this.supabaseService.signOut();
  // }

  toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
  }

  increaseFontSize() {
    const currentSize = parseInt(getComputedStyle(document.body).fontSize);
    document.body.style.fontSize = `${currentSize + 2}px`;
  }

  decreaseFontSize() {
    const currentSize = parseInt(getComputedStyle(document.body).fontSize);
    document.body.style.fontSize = `${currentSize - 2}px`;
  }
} 