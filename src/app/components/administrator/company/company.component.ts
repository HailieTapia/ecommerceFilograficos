import { Component, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import * as addressData from '../shared/direccion.json';
import { CommonModule } from '@angular/common';
import { noXSSValidator } from '../shared/validators';
import { ToastService } from '../../services/toastService';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css'
})

export class CompanyComponent implements OnInit {
  company: any;
  companyForm: FormGroup;
  address: any = addressData;
  isLoading: boolean = true;
  selectedLogoFile: File | null = null;
  logoPreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private companyService: CompanyService
  ) {
    this.companyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), noXSSValidator()]],
      slogan: ['', [Validators.maxLength(100), noXSSValidator()]],
      address_street: ['', [Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ0-9,.:]+( [a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ0-9,.:]+)*$/), Validators.minLength(3), Validators.maxLength(100), noXSSValidator()]],
      address_city: ['', Validators.required],
      address_state: ['', Validators.required],
      address_postal_code: ['', Validators.required],
      address_country: ['', Validators.required],
      phone_number: ['', [Validators.pattern(/^\d{10}$/), noXSSValidator()]],
      email: ['', [Validators.email, noXSSValidator()]],
      facebook: ['', [Validators.pattern('https?://.*'), noXSSValidator()]],
      linkedin: ['', [Validators.pattern('https?://.*'), noXSSValidator()]],
      twitter: ['', [Validators.pattern('https?://.*'), noXSSValidator()]],
      instagram: ['', [Validators.pattern('https?://.*'), noXSSValidator()]],
      logo: [''],
    });
  }

  ngOnInit(): void {
    this.getCompanyInfo();
  }

  // Método para manejar la selección del archivo
  onLogoSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const maxSizeInMB = 2;
      if (file.size > maxSizeInMB * 1024 * 1024) {
        console.log('El archivo excede el tamaño máximo ');
        return;
      }
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        console.log('Solo se permiten archivos de imagen (JPEG, PNG, GIF). ');
        return;
      }

      this.selectedLogoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Método para simular el clic en el input de archivo
  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  getCompanyInfo(): void {
    this.isLoading = true;
    this.companyService.getCompanyInfo().subscribe(
      (response) => {
        this.company = response.company;
        this.companyForm.patchValue({
          name: this.company.name || '',
          slogan: this.company.slogan || '',
          address_street: this.company.address_street || '',
          address_city: this.company.address_city || '',
          address_state: this.company.address_state || '',
          address_postal_code: this.company.address_postal_code || '',
          address_country: this.company.address_country || '',
          phone_number: this.company.phone_number || '',
          email: this.company.email || '',
          facebook: this.company.facebook || '',
          linkedin: this.company.linkedin || '',
          twitter: this.company.twitter || '',
          instagram: this.company.instagram || '',
        });
        if (this.company.logo) {
          this.logoPreview = this.company.logo; 
        }
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || 'Error al obtener la información de la empresa';
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }

  deleteSocialMedia(platform: string): void {
    this.toastService.showToast(
      `¿Estás seguro de eliminar ${platform}?`,
      'warning',
      'Eliminar',
      () => this.confirmDeletion(platform)
    );
  }

  confirmDeletion(platform: string): void {
    this.isLoading = true;
    this.companyForm.get(platform)?.setValue('');

    this.companyService.deleteSocialMediaLinks({ [platform]: true }).subscribe(
      (response) => {
        this.company = response.company;
        this.companyForm.patchValue(response.company);
        this.isLoading = false;
        this.toastService.showToast(`${platform} eliminado correctamente.`, 'success');
      },
      (error) => {
        this.isLoading = false;
        const errorMessage = `Error al eliminar ${platform}: ${error?.error?.message || 'Inténtalo de nuevo'}`;
        this.toastService.showToast(errorMessage, 'error');
      }
    );
  }

  updateCompanyInfo(): void {
    if (this.companyForm.valid) {
      const formData = new FormData();
      Object.keys(this.companyForm.value).forEach((key) => {
        formData.append(key, this.companyForm.get(key)?.value);
      });

      if (this.selectedLogoFile) {
        formData.append('logo', this.selectedLogoFile);
      }

      this.companyService.updateCompanyInfo(formData).subscribe(
        (response) => {
          this.toastService.showToast('Información actualizada correctamente.', 'success');
          this.getCompanyInfo();
        },
        (error) => {
          const errorMessage = error?.error?.message || 'Error al actualizar la información';
          this.toastService.showToast(errorMessage, 'error');
        }
      );
    }
  }
}