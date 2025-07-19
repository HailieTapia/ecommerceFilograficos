import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BannerService, Banner } from '../../services/banner.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements OnInit, OnDestroy {
  banners: Banner[] = [];
  currentIndex = 0;
  loading = true;
  error: string | null = null;
  private autoSlideSubscription: Subscription | null = null;

  constructor(private bannerService: BannerService) {}

  ngOnInit() {
    this.loadBanners();
  }

  ngOnDestroy() {
    this.autoSlideSubscription?.unsubscribe();
  }

  loadBanners() {
    this.bannerService.getActiveBanners().subscribe({
      next: (response) => {
        this.banners = response.banners;
        this.loading = false;
        if (this.banners.length > 1) {
          this.startAutoSlide();
        }
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar los banners';
        this.loading = false;
      }
    });
  }

  nextBanner() {
    this.currentIndex = (this.currentIndex + 1) % this.banners.length;
  }

  prevBanner() {
    this.currentIndex = (this.currentIndex - 1 + this.banners.length) % this.banners.length;
  }

  goToBanner(index: number) {
    this.currentIndex = index;
  }

  startAutoSlide() {
    this.autoSlideSubscription = interval(5000).subscribe(() => this.nextBanner());
  }

  get hasMultipleBanners(): boolean {
    return this.banners.length > 1;
  }

  hasCtaContent(banner: Banner): boolean {
    return !!banner.cta_link && !!banner.cta_text;
  }
}