import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Router, RouterModule } from '@angular/router';
import { AuthApiError } from '@supabase/supabase-js';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ProgressBar, ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [PasswordModule,
    CardModule,
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    ToastModule,
    DividerModule,
    ProgressBarModule,
    RouterModule
  ],
  providers: [MessageService],

})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  showResendEmail = false; // add this property
  sendingEmail = false; // tracks email sending status

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (!this.loginForm.valid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    try {
      const { data, error } = await this.supabaseService.signIn(email, password);

      if (error) {
        // Handle "Email not confirmed" error
        if (error instanceof AuthApiError && error.status === 400 && error.message.includes('Email not confirmed')) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Email Not Confirmed',
            detail: 'Please check your email and verify your account before logging in.'
          });
          this.showResendEmail = true; // show resend button

          return;
        }
        throw error;
      }

      // Successful login
      const user = data.user;
      if (user) {
        // Update BehaviorSubject
        this.supabaseService.setCurrentUser(user);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Login successful!'
        });

        // Optionally fetch role here if needed for routing
        // const userWithRole = await this.supabaseService.getUserWithRole(user.id);
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Login Failed',
        detail: err.message || 'An error occurred. Please try again.'
      });
    } finally {
      this.loading = false;
    }
  }

  // Optional: Resend confirmation email
  async resendConfirmation() {
    const email = this.loginForm.value.email;
    if (!email) return;
    this.sendingEmail = true; // show progress bar

    try {
      const { data, error } = await this.supabaseService.resendConfirmation(email);
      if (error) throw error;

      this.messageService.add({
        severity: 'success',
        summary: 'Email Sent',
        detail: 'Verification email has been resent successfully.'
      });
    } catch (err: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: err.message || 'Could not resend verification email.'
      });
    }
    finally {
      this.sendingEmail = false; // hide progress bar
    }
  }
}
