import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PublicProductService } from '../../../services/PublicProductService';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../../services/toastService';
import { CollaboratorsService } from '../../../services/collaborators.service';
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  product: any = null;
  selectedVariant: any = null;
  selectedImage: string | null = null;
  isLoading = true;
  error: string | null = null;
  showFullDescription = false;
  showFullAttributes = false;
  showFullCustomizations = false;
  currentImageIndex = 0;
  collaborators: any[] = [];
  constructor(
    private collaboratorService: CollaboratorsService,
    private router: Router,
    private toastService: ToastService,
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
    this.isLoading = true;
    this.error = null;
    this.productService.getProductById(productId).subscribe(response => {
      this.product = response.product;
      if (this.product.variants && this.product.variants.length > 0) {
        this.selectVariant(this.product.variants[0]);
      }
      this.isLoading = false;
    }, error => {
      const errorMessage = error?.error?.message || 'Error al cargar detalles del producto';
      this.toastService.showToast(errorMessage, 'error');
      this.isLoading = false;
    });
  }

  selectVariant(variant: any) {
    this.selectedVariant = variant;
    this.currentImageIndex = 0;
    if (variant.images && variant.images.length > 0) {
      this.selectedImage = variant.images[0].image_url;
    } else {
      this.selectedImage = null;
    }
  }

  changeImage(imageUrl: string) {
    this.selectedImage = imageUrl;
    this.currentImageIndex = this.selectedVariant.images.findIndex((img: any) => img.image_url === imageUrl);
  }

  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.selectedImage = this.selectedVariant.images[this.currentImageIndex].image_url;
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.selectedVariant.images.length - 1) {
      this.currentImageIndex++;
      this.selectedImage = this.selectedVariant.images[this.currentImageIndex].image_url;
    }
  }

  formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? 'N/A' : numPrice.toFixed(2);
  }

  requireLogin() {
    this.toastService.showToast('Necesitas iniciar sesión para realizar esta acción', 'warning');
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  shareOnWhatsApp() {
    const url = window.location.href;
    const text = `Mira este producto: ${this.product.name} - ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  }

  copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.toastService.showToast('Enlace copiado al portapapeles', 'success');
    }).catch(() => {
      this.toastService.showToast('Error al copiar el enlace', 'error');
    });
  }
  loadCollaborators() {
    this.collaboratorService.getPublicCollaborators().subscribe({
      next: (response) => {
        this.collaborators = response;
      },
      error: (error) => {
        console.error('Error al cargar los colaboradores:', error);
        this.collaborators = [];
      }
    });
  }
}