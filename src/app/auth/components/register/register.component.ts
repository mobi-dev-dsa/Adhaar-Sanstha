import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';

// Interfaces for better type safety
interface UserRegistrationData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobile?: string;
  password: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    ToastModule,
    DividerModule
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  loading = false;
  emailChecking = false;
  emailAvailable = true;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.setupEmailAvailabilityCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.maxLength(100), this.noWhitespaceValidator]],
        middleName: ['', [Validators.maxLength(100)]],
        lastName: ['', [Validators.required, Validators.maxLength(100), this.noWhitespaceValidator]],
        email: ['', [Validators.required, Validators.email]],
        mobile: [
          '',
          [
            Validators.maxLength(15),
            Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/),
          ],
        ],
        password: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        ]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: [this.passwordsMatchValidator] }
    );
  }

  private setupEmailAvailabilityCheck(): void {
    this.registerForm.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(email => {
        if (this.registerForm.get('email')?.valid && email) {
          this.checkEmailAvailability(email);
        } else {
          this.emailAvailable = true;
        }
      });
  }

  // Custom validator to check for whitespace only
  private noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value && control.value.trim().length === 0) {
      return { whitespace: true };
    }
    return null;
  }

  // Custom validator for confirm password
  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;

    if (pass && confirm && pass !== confirm) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    // Clear the mismatch error if passwords match
    if (group.get('confirmPassword')?.errors?.['mismatch']) {
      group.get('confirmPassword')?.setErrors(null);
    }

    return null;
  }

  private async checkEmailAvailability(email: string): Promise<void> {
    this.emailChecking = true;

    try {
      // This would call your SupabaseService to check if email exists
      // For now, we'll simulate this with a simple check
      const isAvailable = await this.supabaseService.checkEmailAvailable(email);
      this.emailAvailable = isAvailable;

      if (!isAvailable) {
        this.registerForm.get('email')?.setErrors({ notAvailable: true });
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      // Don't block registration if check fails
      this.emailAvailable = true;
    } finally {
      this.emailChecking = false;
    }
  }

  private sanitizeInputs(): void {
    const values = this.registerForm.value;

    Object.keys(values).forEach(key => {
      if (typeof values[key] === 'string') {
        this.registerForm.get(key)?.setValue(values[key].trim(), { emitEvent: false });
      }
    });
  }

  get f() { return this.registerForm.controls; }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      // Show specific error message for email availability
      if (this.registerForm.get('email')?.errors?.['notAvailable']) {
        this.messageService.add({
          severity: 'error',
          summary: 'Email already registered',
          detail: 'This email address is already associated with an account.',
        });
      }

      return;
    }

    this.sanitizeInputs();
    this.loading = true;

    const formValues = this.registerForm.value;
    const userData: UserRegistrationData = {
      firstName: formValues.firstName,
      middleName: formValues.middleName || undefined,
      lastName: formValues.lastName,
      email: formValues.email,
      mobile: formValues.mobile || undefined,
      password: formValues.password,
    };

    try {
      await this.supabaseService.signUp(userData, 2 /* default PWD role */);

      this.messageService.add({
        severity: 'success',
        summary: 'Registration successful',
        detail: 'Please check your email to verify your account.',
      });

      this.registerForm.reset();
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);

    } catch (error: any) {
      let errorDetail = 'Please try again.';
      debugger
      // Handle specific error cases
      if (error.message?.includes('already registered') || error.message?.includes('exists')) {
        errorDetail = 'This email is already registered.';
      } else if (error.message?.includes('password')) {
        errorDetail = 'Password does not meet security requirements.';
      } else if (error.message?.includes('email')) {
        errorDetail = 'Please provide a valid email address.';
      }

      this.messageService.add({
        severity: 'error',
        summary: 'Registration failed',
        detail: errorDetail,
      });
    } finally {
      this.loading = false;
    }
  }
}