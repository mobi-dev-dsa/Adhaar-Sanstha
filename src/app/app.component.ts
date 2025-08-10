import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { TranslateService } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';
import { TranslationLoaderService } from './core/services/TranslationLoaderService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, LoaderComponent, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Aadhar Sanstha';

  constructor(
    private translateService: TranslateService,
    private translationLoader: TranslationLoaderService
  ) {
    // Set default language
    this.translateService.setDefaultLang('en');
  }

  ngOnInit() {
    // Load default English translations
    this.translationLoader.getTranslation('en').subscribe(
      (translations) => {
        this.translateService.setTranslation('en', translations, true);
        this.translateService.use('en');
      },
      (error) => {
        console.error('Error loading default translations:', error);
      }
    );
  }
}

