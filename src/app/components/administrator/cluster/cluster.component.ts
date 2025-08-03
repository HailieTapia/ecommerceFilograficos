import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClusterService,ClientCluster } from '../../../services/cluster.service';

@Component({
  selector: 'app-cluster',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cluster.component.html',
  styleUrls: ['./cluster.component.css']
})
export class ClusterComponent implements OnInit {
clusters: { [key: number]: ClientCluster[] } = {
    0: [],
    1: [],
    2: []
  };
  clusterCounts: { [key: number]: number } = {
    0: 0,
    1: 0,
    2: 0
  };
  loading = true;
  error: string | null = null;
  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.clusterService.getAllClientClusters().subscribe({
      next: (res) => {
        res.forEach((item: any) => {
          const clusterId = item.cluster;
          if (this.clusters.hasOwnProperty(clusterId)) {
            this.clusters[clusterId].push(item);
            this.clusterCounts[clusterId]++;
          }
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los datos de clúster';
        this.loading = false;
      }
    });
  }
}