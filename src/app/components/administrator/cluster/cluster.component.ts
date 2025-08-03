import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClusterService, ClusterGroup } from '../../../services/cluster.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cluster',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.css']
})
export class ClusterComponent implements OnInit {
  clusters: ClusterGroup[] = [];
  selectedClusterId: number | null = null;
  loading = true;
  error: string | null = null;

  constructor(private clusterService: ClusterService) { }

  ngOnInit(): void {
    this.clusterService.getAllClientClusters().subscribe({
      next: (res: ClusterGroup[]) => {
        this.clusters = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al cargar los datos de clúster';
        this.loading = false;
      }
    });
  }

  // Método para manejar la selección de un clúster
  onClusterSelect(clusterId: number | null): void {
    this.selectedClusterId = clusterId;
    console.log(`Clúster seleccionado: ${clusterId}`); 
  }

  // Placeholder para aplicar acciones a los usuarios del clúster seleccionado
  applyActionToCluster(): void {
    if (this.selectedClusterId === null) {
      alert('Por favor, selecciona un clúster primero.');
      return;
    }
    console.log(`Aplicando acción al clúster ${this.selectedClusterId}`);
  }
}