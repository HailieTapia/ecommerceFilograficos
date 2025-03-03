import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule, ValidatorFn, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { noXSSValidator } from '../../shared/validators';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule], 
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

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.parentForm.addControl(
      this.passwordControlName,
      this.fb.control('', {
        validators: [Validators.required, Validators.minLength(8), noXSSValidator()],
        asyncValidators: [this.checkHIBPValidator()], // Agrega validador asíncrono
        updateOn: 'blur'
      })
    );

    if (this.showConfirmPassword) {
      this.parentForm.addControl(
        this.confirmPasswordControlName,
        this.fb.control('', [Validators.required])
      );
      this.parentForm.setValidators(this.passwordsMatchValidator());
    }

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
    return (formGroup: AbstractControl): ValidationErrors | null => {
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

  private checkHIBPValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const password = control.value;
      if (!password) return of(null);

      const sha1 = this.sha1(password);
      const prefix = sha1.substring(0, 5);
      const suffix = sha1.substring(5).toUpperCase();

      return this.http.get(`https://api.pwnedpasswords.com/range/${prefix}`, { responseType: 'text' })
        .pipe(
          switchMap(response => {
            const isPwned = response.split('\n').some(line => {
              const [hashSuffix, count] = line.split(':');
              return hashSuffix === suffix && parseInt(count, 10) > 0;
            });
            return of(isPwned ? { pwned: true } : null);
          }),
          catchError(() => of(null)) 
        );
    };
  }

  private sha1(password: string): string {
    return CryptoJS.SHA1(password).toString(CryptoJS.enc.Hex).toUpperCase();
  }
}
