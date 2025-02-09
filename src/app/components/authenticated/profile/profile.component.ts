import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  error: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.getUserProfile();
  }

  getUserProfile(): void {
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.user = data;
        this.error = null;
      },
      error: (err) => {
        this.error = 'Error al obtener el perfil del usuario';
        console.error('Error:', err);
      }
    });
  }
}