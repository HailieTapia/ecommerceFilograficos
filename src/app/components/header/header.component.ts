import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],  
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  userRole: string | null = null;
  isLoggedIn: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      if (user) {
        this.userRole = user.tipo;
        this.isLoggedIn = true;
      } else {
        this.userRole = null;
        this.isLoggedIn = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
  }
}
