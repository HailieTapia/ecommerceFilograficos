import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupportInquiryService } from '../../../services/support-inquiry.service';
import { CompanyService } from '../../../services/company.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/config';

@Component({
  selector: 'app-support-inquiry',
  templateUrl: './support-inquiry.component.html',
  styleUrls: ['./support-inquiry.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
})
export class SupportInquiryComponent implements OnInit, AfterViewInit {
  supportForm: FormGroup;
  companyInfo: any;
  submitted = false;
  errorMessage: string = '';
  siteKey = environment.recaptchaSiteKey;

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
      recaptchaToken: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.getCompanyInfo();
  }

  ngAfterViewInit() {
    this.loadRecaptcha();
  }

  loadRecaptcha() {
    if ((window as any).grecaptcha) {
      (window as any).grecaptcha.render('support-recaptcha-container', {
        sitekey: this.siteKey,
        callback: (response: string) => this.onCaptchaResolved(response),
        'expired-callback': () => this.supportForm.patchValue({ recaptchaToken: '' }),
      });
    } else {
      console.error('reCAPTCHA no está disponible');
    }
  }

  onCaptchaResolved(token: string) {
    this.supportForm.patchValue({ recaptchaToken: token });
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
        this.errorMessage = error.error?.message || 'Hubo un error al enviar tu mensaje. Por favor, inténtalo de nuevo.';
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    );
  }
}