import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { noXSSValidator } from '../../shared/validators';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-password',
  standalone: true,
  imports: [CommonModule,FormsModule, ReactiveFormsModule],
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
}