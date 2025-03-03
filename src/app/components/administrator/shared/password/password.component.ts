import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { noXSSValidator } from '../../shared/validators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './password.component.html',
  styleUrls: ['./password.component.css']
})
export class PasswordComponent implements OnInit {
  @Input() parentForm!: FormGroup;
  @Input() showConfirmPassword: boolean = true;
  @Input() passwordControlName: string = 'password';
  @Input() confirmPasswordControlName: string = 'confirmPassword';

  passwordVisible = false;
  confirmPasswordVisible = false;
  strength: number = 0; 
  strengthClass: string = ''; 

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.parentForm.addControl(
      this.passwordControlName,
      this.fb.control('', [Validators.required, Validators.minLength(8), noXSSValidator()])
    );

    if (this.showConfirmPassword) {
      this.parentForm.addControl(
        this.confirmPasswordControlName,
        this.fb.control('', [Validators.required])
      );
      this.parentForm.setValidators(this.passwordsMatchValidator());
    }

    // Suscripción al cambio de valor para calcular la fuerza
    this.parentForm.get(this.passwordControlName)?.valueChanges.subscribe(value => {
      this.calculateStrength(value);
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  passwordsMatchValidator(): ValidatorFn {
    return (formGroup: AbstractControl): { [key: string]: any } | null => {
      const password = formGroup.get(this.passwordControlName)?.value;
      const confirmPassword = formGroup.get(this.confirmPasswordControlName)?.value;

      if (this.showConfirmPassword && password !== confirmPassword) {
        formGroup.get(this.confirmPasswordControlName)?.setErrors({ mismatch: true });
        return { mismatch: true };
      } else {
        formGroup.get(this.confirmPasswordControlName)?.setErrors(null);
        return null;
      }
    };
  }

  private calculateStrength(password: string) {
    if (!password) {
      this.strength = 0;
      this.strengthClass = '';
      return;
    }
    let score = 0;
    if (password.length > 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    this.strength = Math.min(score, 100);
    this.strengthClass = this.strength < 40 ? 'weak' : this.strength < 80 ? 'medium' : 'strong';
  }
}