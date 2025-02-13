import { Component } from '@angular/core';
import { TypeService } from '../../services/type.service';

@Component({
  selector: 'app-email-type',
  standalone: true,
  imports: [],
  templateUrl: './email-type.component.html',
  styleUrl: './email-type.component.css'
})
export class EmailTypeComponent {
  constructor(
    private typeService: TypeService,

  ){}
}
