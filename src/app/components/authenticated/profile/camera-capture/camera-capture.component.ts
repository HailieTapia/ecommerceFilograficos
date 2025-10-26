import { Component, EventEmitter, Output, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ToastService } from '../../../../services/toastService';
import { CommonModule } from '@angular/common'; // Necesario para usar *ngIf en el template

@Component({
  selector: 'app-camera-capture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './camera-capture.component.html',
  styleUrls: ['./camera-capture.component.css']
})
// [MODIFICADO]: Implementar OnDestroy para limpiar el stream
export class CameraCaptureComponent implements OnDestroy {
  // [MODIFICADO]: Usar ViewChild para una referencia más segura al elemento de video
  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;
  
  // [MODIFICADO]: photoCaptured ahora puede emitir File o null (para cancelación)
  @Output() photoCaptured = new EventEmitter<File | null>();
  
  stream: MediaStream | null = null;
  isStreaming: boolean = false; // [NUEVO]: Controla si la cámara está activa

  constructor(private toastService: ToastService) {}

  // [NUEVO]: Detener la cámara al destruir el componente
  ngOnDestroy(): void {
    this.stopCameraStream();
  }

  async startCamera(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('La API de cámara no está soportada en este navegador.');
      this.toastService.showToast('La cámara no es compatible con este navegador.', 'error');
      return;
    }
    
    this.stopCameraStream(); // Limpiar streams anteriores

    try {
      // Usar facingMode: 'user' (cámara frontal) para una experiencia tipo selfie
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      
      const videoElement = this.videoElementRef.nativeElement;
      videoElement.srcObject = this.stream;
      
      await videoElement.play();
      this.isStreaming = true;
      
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      this.toastService.showToast('No se pudo acceder a la cámara. Verifica los permisos.', 'error');
      this.isStreaming = false;
    }
  }

  capturePhoto(): void {
    const videoElement = this.videoElementRef.nativeElement;
    if (!videoElement || !this.stream) {
        this.toastService.showToast('La cámara no está activa.', 'error');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Dibujar la imagen
    canvas.getContext('2d')?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        // [MODIFICADO]: Nombre de archivo más descriptivo
        const file = new File([blob], `profile_${Date.now()}.jpg`, { type: 'image/jpeg' });
        this.photoCaptured.emit(file);
      } else {
        this.toastService.showToast('Error al crear el archivo de imagen.', 'error');
      }
    }, 'image/jpeg', 0.95); // 0.95 es la calidad (optimización)
  }

  stopCameraStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isStreaming = false;
  }
  
  // Función de cancelación que notifica al padre y limpia
  stopCamera(): void {
    this.stopCameraStream();
    this.photoCaptured.emit(null); // Emitir null para indicar cancelación
  }
}
