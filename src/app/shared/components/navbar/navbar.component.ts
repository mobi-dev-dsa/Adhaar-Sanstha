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

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonModule, MenuModule, DropdownModule, TieredMenuModule, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  currentUser$ = this.supabaseService.getCurrentUser();
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
      command: () => {}
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {}
    },
    {
      separator: true
    },
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => this.signOut()
    }
  ];

  constructor(
    private translateService: TranslateService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    this.selectedLanguage = this.languages.find(lang => 
      lang.value === this.translateService.currentLang
    ) || this.languages[0];
  }

  onLanguageChange(event: any) {
    this.translateService.use(event.value);
  }

  async signOut() {
    await this.supabaseService.signOut();
  }

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