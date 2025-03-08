import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/public/footer/footer.component';
import { ToastComponent } from '../app/components/administrator/shared/toast/toast.component';
import { ThemeService } from '.././app/components/services/theme.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToastComponent,FooterComponent,HeaderComponent,RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(

    private themeService: ThemeService
  ) {
   
  }

}
