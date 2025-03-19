import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PublicProductService } from '../../../services/PublicProductService';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: any = null;
  selectedImage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: PublicProductService
  ) { }

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('productId');
    if (productId) {
      this.loadProductDetails(+productId);
    }
  }

  loadProductDetails(productId: number) {
    this.productService.getProductById(productId).subscribe(response => {
      this.product = response.product;
      // Establecer la primera imagen como predeterminada
      if (this.product.variants[0]?.images?.length > 0) {
        this.selectedImage = this.product.variants[0].images[0].image_url;
      }
    }, error => {
      console.error('Error al cargar detalles del producto:', error);
    });
  }

  changeImage(imageUrl: string) {
    this.selectedImage = imageUrl;
  }
}
