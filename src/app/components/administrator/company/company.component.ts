import { Component, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-company',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css'
})

export class CompanyComponent implements OnInit {
  company: any;
  companyForm: FormGroup;
  isUpdating: boolean = false;

  constructor(private fb: FormBuilder, private companyService: CompanyService) {
    this.companyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      slogan: ['', [Validators.maxLength(100)]],
      page_title: ['', Validators.required],
      address_street: ['', [Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ0-9,.:]+( [a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ0-9,.:]+)*$/), Validators.minLength(3), Validators.maxLength(100)]],
      address_city: ['', Validators.required],
      address_state: ['', [Validators.pattern(/^(?! )[a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑäöüÄÖÜ]+)*$/), Validators.minLength(2), Validators.maxLength(50)]],
      address_postal_code: ['', [Validators.pattern(/^\d{5}$/)]],
      address_country: ['', Validators.required],
      phone_number: ['', [Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.email]],
      facebook: ['', [Validators.pattern('https?://.*')]],
      linkedin: ['', [Validators.pattern('https?://.*')]],
      twitter: ['', [Validators.pattern('https?://.*')]],
      instagram: ['', [Validators.pattern('https?://.*')]],
    });
  }

  ngOnInit(): void {
    this.getCompanyInfo();
  }

  // Obtener la información de la empresa
  getCompanyInfo(): void {
    this.companyService.getCompanyInfo().subscribe(
      (response) => {
        this.company = response.company;
        this.patchFormValues(this.company);
        console.log('Obtención con éxito:', response);
      },
      (error) => {
        console.error('Error al obtener:', error);
      }
    );
  }

  // Método para eliminar un enlace de red social individualmente
  deleteSocialMedia(platform: string): void {
    this.isUpdating = true; 

    this.companyForm.get(platform)?.setValue('');  

    this.companyService.deleteSocialMediaLinks({ [platform]: true }).subscribe(
      (response) => {
        console.log(`${platform} eliminado correctamente`);
        this.company = response.company;
        this.companyForm.patchValue(response.company); 

        this.isUpdating = false;
      },
      (error) => {
        console.error(`Error al eliminar ${platform}:`, error);
        this.isUpdating = false;  
      }
    );
  }
  // Método para actualizar el formulario con los valores de la empresa de forma dinámica
  patchFormValues(company: any): void {
    if (company) {
      Object.keys(company).forEach(key => {
        if (this.companyForm.contains(key)) {
          this.companyForm.get(key)?.setValue(company[key]);
        }
      });
    }
  }

  // Método para actualizar la información de la empresa
  updateCompanyInfo(): void {
    if (this.companyForm.valid && !this.isUpdating) {  
      console.log('Datos enviados para actualizar:', this.companyForm.value);
      this.companyService.updateCompanyInfo(this.companyForm.value).subscribe(
        (response) => {
          console.log('Información de la empresa actualizada:', response);
        },
        (error) => {
          console.error('Error al actualizar:', error);
        }
      );
    } else {
      console.log('Formulario no válido o en proceso de actualización');
    }
  }
}