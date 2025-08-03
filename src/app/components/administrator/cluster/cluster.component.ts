import { Component,OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClusterService } from '../../../services/cluster.service'; 
import { NgIf, NgFor } from '@angular/common';
@Component({
  selector: 'app-cluster',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cluster.component.html',
  styleUrl: './cluster.component.css'
})
export class ClusterComponent implements OnInit {
  clientClusters: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.clusterService.getAllClientClusters().subscribe({
      next: (data) => {
        console.log(data);
        this.clientClusters = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Ocurrió un error al cargar los clústeres.';
        this.loading = false;
      }
    });
  }
}