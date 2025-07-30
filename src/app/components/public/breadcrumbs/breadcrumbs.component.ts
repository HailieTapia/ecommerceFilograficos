import { Component, OnInit } from '@angular/core';
import { BreadcrumbsService } from '../../../services/breadcrumbs.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.css'
})
export class BreadcrumbsComponent implements OnInit {
  breadcrumbs: any[] = [];

  constructor(private breadcrumbsService: BreadcrumbsService) { }

  ngOnInit(): void {
    this.breadcrumbsService.breadcrumbs$.subscribe(breadcrumbs => {
      this.breadcrumbs = breadcrumbs;
    });
  }
}