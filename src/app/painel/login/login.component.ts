import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  errorMessage: string | null = null;
  passwordVisible = false;

  constructor() {
    this.loginForm = this.fb.group({
      login: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(): void {
    this.errorMessage = null;
    if (this.loginForm.invalid) {
      this.errorMessage = 'Por favor, preencha o login e a senha.';
      return;
    }

    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {        
        this.router.navigate(['/painel/dashboard']);
      },
      error: (err) => {
        //console.error('Erro no login:', err);
        if (err.status === 401 || err.status === 400) {
          this.errorMessage = 'Login ou senha inválidos.';
        } else {
          this.errorMessage = 'Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.';
        }
        this.loginForm.patchValue({ password: '' });
      }
    });
  }
}
