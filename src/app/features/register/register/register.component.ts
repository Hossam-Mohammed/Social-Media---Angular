import { Component, inject, type OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
} from '@angular/forms';
import { initFlowbite } from 'flowbite';
import { AuthService } from '../../../core/services/Auth/auth.service.js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private _AuthService = inject(AuthService);
  private _Router = inject(Router);

  resMessage: string = '';
  registerForm: FormGroup = new FormGroup(
    {
      name: new FormControl(null, [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,}){0,3}$/),
      ]),
      username: new FormControl(null, [
        Validators.minLength(3),
        Validators.maxLength(15),
        Validators.pattern(/^[a-z0-9_]{3,15}$/),
      ]),
      email: new FormControl(null, [Validators.required, Validators.email]),
      dateOfBirth: new FormControl(null, Validators.required),
      gender: new FormControl(null, [Validators.required, Validators.pattern(/^(?:male|female)$/)]),
      password: new FormControl(null, [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
      ]),
      rePassword: new FormControl(null, [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
      ]),
    },
    this.confirmPassword,
  );

  confirmPassword(g: AbstractControl) {
    return g.get('password')?.value === g.get('rePassword')?.value ? null : { missmatch: true };
  }
  register() {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
      this._AuthService.SignUp(this.registerForm.value).subscribe({
        next: (res) => {
          console.log(res);
          this._Router.navigate(['/login']);
        },
        error: (err) => {
          console.log(err);
          this.resMessage = err.error.message;
        },
      });
    }
  }
}
