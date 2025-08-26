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
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, CarouselModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  ngOnInit() {
    console.log('HomeComponent initialized');
  }
  heroImages = [
    { src: 'assets/images/hero1.jpg', alt: 'Skill Development' },
    { src: 'assets/images/hero2.jpg', alt: 'Healthcare Support' },
    { src: 'assets/images/hero3.jpg', alt: 'Community Inclusion' }
  ];

  features = [
    {
      icon: 'pi pi-users',
      title: 'Community Support',
      description: 'Building a supportive community for persons with disabilities'
    },
    {
      icon: 'pi pi-graduation-cap',
      title: 'Skill Development',
      description: 'Comprehensive training programs for personal and professional growth'
    },
    {
      icon: 'pi pi-heart',
      title: 'Healthcare Access',
      description: 'Medical support and assistive devices for better quality of life'
    },
    {
      icon: 'pi pi-briefcase',
      title: 'Employment Assistance',
      description: 'Job placement and workplace accommodation support'
    }
  ];

  stats = [
    { number: '500+', label: 'PWDs Supported' },
    { number: '50+', label: 'Training Programs' },
    { number: '1000+', label: 'Assistive Devices' },
    { number: '200+', label: 'Job Placements' }
  ];
} 