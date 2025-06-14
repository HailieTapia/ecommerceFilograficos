import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.css']
})
export class ProfileDropdownComponent {
  @Input() userRole: string | null = null;
  @Output() logout = new EventEmitter<void>();
  isProfileDropdownOpen = false;

  toggleProfileDropdown() {
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  openProfileDropdown() {
    this.isProfileDropdownOpen = true;
  }

  closeProfileDropdown() {
    this.isProfileDropdownOpen = false;
  }
}