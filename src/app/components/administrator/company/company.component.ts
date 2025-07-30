import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CompanyService } from '../../../services/company.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import * as addressData from '../shared/direccion.json';
import { CommonModule } from '@angular/common';
import { noXSSValidator } from '../shared/validators';
import { ToastService } from '../../../services/toastService';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit {
  company: any;
  companyForm: FormGroup;
  socialMediaForm: FormGroup;
  address: any = addressData;
  isLoading: boolean = true;
  selectedLogoFile: File | null = null;
  logoPreview: string | ArrayBuffer | null = null;
  socialMediaOptions: string[] = [
    'Facebook', 'Twitter', 'LinkedIn', 'Instagram', 'YouTube', 'TikTok', 'Pinterest', 'Snapchat',
    'Reddit', 'Tumblr', 'WhatsApp', 'Telegram', 'Discord', 'Twitch', 'GitHub', 'GitLab', 'Bitbucket',
    'Dribbble', 'Behance', 'Medium', 'Vimeo', 'Flickr', 'SoundCloud', 'Spotify', 'Threads'
  ];
  filteredSocialMedia: string[] = [];
  socialMediaInputValue: string = '';
  isEditingSocialMedia: boolean = false;
  editingSocialMediaId: number | null = null;

  @ViewChild('socialMediaInput') socialMediaInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    public companyService: CompanyService
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
    });

    this.socialMediaForm = this.fb.group({
      socialMediaName: ['', [Validators.required, noXSSValidator()]],
      socialMediaLink: ['', [Validators.required, Validators.pattern('https?://.+'), noXSSValidator()]]
    });
  }

  ngOnInit(): void {
    this.getCompanyInfo();
    this.filteredSocialMedia = [...this.socialMediaOptions];
  }

  filterSocialMedia(value: string): void {
    this.socialMediaInputValue = value;
    if (!value) {
      this.filteredSocialMedia = [...this.socialMediaOptions];
      return;
    }
    const filterValue = value.toLowerCase();
    this.filteredSocialMedia = this.socialMediaOptions.filter(option =>
      option.toLowerCase().includes(filterValue)
    );
  }

  onSocialMediaInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.filterSocialMedia(target.value);
    }
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file: File | undefined = input.files?.[0];
    if (file) {
      const maxSizeInMB = 2;
      if (file.size > maxSizeInMB * 1024 * 1024) {
        this.toastService.showToast('El archivo excede el tamaño máximo de 2MB', 'error');
        return;
      }
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        this.toastService.showToast('Solo se permiten archivos de imagen (JPEG, PNG, GIF)', 'error');
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

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  getCompanyInfo(): void {
    this.isLoading = true;
    this.companyService.getCompanyInfo().subscribe({
      next: (response) => {
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
          email: this.company.email || ''
        });
        if (this.company.logo) {
          this.logoPreview = this.company.logo;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error?.error?.message || 'Error al obtener la información de la empresa';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  updateCompanyInfo(): void {
    if (this.companyForm.valid) {
      const formData = new FormData();
      Object.keys(this.companyForm.value).forEach((key) => {
        formData.append(key, this.companyForm.get(key)?.value || '');
      });

      if (this.selectedLogoFile) {
        formData.append('logo', this.selectedLogoFile);
      }

      this.companyService.updateCompany(formData).subscribe({
        next: (response) => {
          this.toastService.showToast('Información actualizada correctamente.', 'success');
          this.getCompanyInfo();
        },
        error: (error) => {
          const errorMessage = error?.error?.message || 'Error al actualizar la información';
          this.toastService.showToast(errorMessage, 'error');
        }
      });
    }
  }

  addSocialMedia(): void {
    if (this.socialMediaForm.valid) {
      const { socialMediaName, socialMediaLink } = this.socialMediaForm.value;
      if (this.isEditingSocialMedia && this.editingSocialMediaId) {
        this.updateSocialMedia(this.editingSocialMediaId, socialMediaName, socialMediaLink);
      } else {
        this.companyService.addSocialMedia({ name: socialMediaName, link: socialMediaLink }).subscribe({
          next: (response) => {
            this.toastService.showToast(`Red social ${socialMediaName} agregada exitosamente`, 'success');
            this.resetSocialMediaForm();
            this.getCompanyInfo();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Error al agregar la red social';
            this.toastService.showToast(errorMessage, 'error');
          }
        });
      }
    }
  }

  editSocialMedia(socialMedia: any): void {
    this.isEditingSocialMedia = true;
    this.editingSocialMediaId = socialMedia.social_media_id;
    this.socialMediaForm.patchValue({
      socialMediaName: socialMedia.name,
      socialMediaLink: socialMedia.link
    });
    this.filterSocialMedia(socialMedia.name);
  }

  updateSocialMedia(socialMediaId: number, name: string, link: string): void {
    this.companyService.updateSocialMedia({ social_media_id: socialMediaId, name, link }).subscribe({
      next: (response) => {
        this.toastService.showToast(`Red social ${name} actualizada exitosamente`, 'success');
        this.resetSocialMediaForm();
        this.getCompanyInfo();
      },
      error: (error) => {
        const errorMessage = error?.error?.message || 'Error al actualizar la red social';
        this.toastService.showToast(errorMessage, 'error');
      }
    });
  }

  deleteSocialMedia(socialMediaId: number): void {
    if (this.company?.SocialMedia?.length <= 1) {
      this.toastService.showToast('No puedes eliminar la única red social registrada.', 'warning');
      return;
    }

    this.toastService.showToast(
      '¿Estás seguro de que deseas eliminar esta red social? Esta acción no se puede deshacer.',
      'warning',
      'Confirmar',
      () => {
        this.companyService.deleteSocialMedia(socialMediaId).subscribe({
          next: (response) => {
            this.toastService.showToast(response.message || 'Red social eliminada exitosamente', 'success');
            this.getCompanyInfo();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Error al eliminar la red social';
            this.toastService.showToast(errorMessage, 'error');
          }
        });
      }
    );
  }

  resetSocialMediaForm(): void {
    this.socialMediaForm.reset();
    this.filteredSocialMedia = [...this.socialMediaOptions];
    this.socialMediaInputValue = '';
    this.isEditingSocialMedia = false;
    this.editingSocialMediaId = null;
  }

  canDeleteSocialMedia(): boolean {
    return this.company?.SocialMedia?.length > 1;
  }
}