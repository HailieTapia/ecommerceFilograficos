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
  deleteSocialForm: FormGroup;

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
    this.deleteSocialForm = this.fb.group({
      facebook: [false],
      twitter: [false],
      linkedin: [false],
      instagram: [false]
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
  // Método para eliminar los enlaces de redes sociales seleccionados
  onDeleteSocialMediaLinks(): void {
    const payload = this.deleteSocialForm.value;
    this.companyService.deleteSocialMediaLinks(payload).subscribe(
      (response) => {
        console.log(response.message);
        this.company = response.company; 
        this.companyForm.patchValue(response.company);
      },
      (error) => {
        console.error('Error al eliminar enlaces de redes sociales:', error);
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
  // Actualizar la información de la empresa
  updateCompanyInfo(): void {
    if (this.companyForm.valid) {
      this.companyService.updateCompanyInfo(this.companyForm.value).subscribe(
        (response) => {
          console.log('Información de la empresa actualizada:', response);
        },
        (error) => {
          console.error('Error al actualizar:', error);
        }
      );
    } else {
      console.log('Formulario no válido');
    }
  }
}
