import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.css']
})
export class ProfileDropdownComponent {
  @Input() userRole: string | null = null;
  @Input() userName: string | null = null;
  @Input() profilePictureUrl: string | null = null;
  @Output() logout = new EventEmitter<void>();
  isProfileDropdownOpen = false;

  constructor(public themeService: ThemeService, private elementRef: ElementRef) {}

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  openProfileDropdown() {
    this.isProfileDropdownOpen = true;
  }

  closeProfileDropdown() {
    this.isProfileDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeProfileDropdown();
    }
  }
}