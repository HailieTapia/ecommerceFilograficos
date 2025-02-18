import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupportInquiryService } from '../../services/support-inquiry.service';
import { CompanyService } from '../../services/company.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-support-inquiry',
  templateUrl: './support-inquiry.component.html',
  styleUrls: ['./support-inquiry.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
})
export class SupportInquiryComponent implements OnInit {
  supportForm: FormGroup;
  companyInfo: any;
  submitted = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private supportInquiryService: SupportInquiryService,
    private companyService: CompanyService
  ) {
    this.supportForm = this.fb.group({
      user_name: ['', [Validators.required, Validators.minLength(2)]],
      user_email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.getCompanyInfo();
  }

  getCompanyInfo(): void {
    this.companyService.getCompanyInfo().subscribe(
      (response) => {
        this.companyInfo = response.company;
      },
      (error) => {
        console.error('Error al obtener la información de la empresa:', error);
      }
    );
  }

  onSubmit(): void {
    if (this.supportForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      return;
    }

    const formData = this.supportForm.value;
    this.supportInquiryService.createConsultation(formData).subscribe(
      (response) => {
        this.submitted = true;
        this.supportForm.reset();
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
          this.submitted = false;
        }, 3000);
      },
      (error) => {
        this.errorMessage = 'Hubo un error al enviar tu mensaje. Por favor, inténtalo de nuevo.';
        // Ocultar mensaje de error después de 5 segundos
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    );
  }
}