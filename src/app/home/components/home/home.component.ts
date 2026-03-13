import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    CarouselModule,
    TranslateModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  ngOnInit() {
    console.log('HomeComponent initialized');
  }

  heroImages = [
    { src: 'assets/images/hero1.jpg', alt: 'HOME.FEATURES.SKILL_TITLE' },
    { src: 'assets/images/hero2.jpg', alt: 'HOME.FEATURES.HEALTH_TITLE' },
    { src: 'assets/images/hero3.jpg', alt: 'HOME.FEATURES.COMMUNITY_TITLE' },
  ];

  features = [
    {
      icon: 'pi pi-users',
      title: 'HOME.FEATURES.COMMUNITY_TITLE',
      description: 'HOME.FEATURES.COMMUNITY_DESC',
    },
    {
      icon: 'pi pi-graduation-cap',
      title: 'HOME.FEATURES.SKILL_TITLE',
      description: 'HOME.FEATURES.SKILL_DESC',
    },
    {
      icon: 'pi pi-heart',
      title: 'HOME.FEATURES.HEALTH_TITLE',
      description: 'HOME.FEATURES.HEALTH_DESC',
    },
    {
      icon: 'pi pi-briefcase',
      title: 'HOME.FEATURES.EMPLOYMENT_TITLE',
      description: 'HOME.FEATURES.EMPLOYMENT_DESC',
    },
  ];

  stats = [
    { number: '500+', label: 'HOME.STATS.PWD' },
    { number: '50+', label: 'HOME.STATS.TRAINING' },
    { number: '1000+', label: 'HOME.STATS.DEVICES' },
    { number: '200+', label: 'HOME.STATS.PLACEMENTS' },
  ];
}
