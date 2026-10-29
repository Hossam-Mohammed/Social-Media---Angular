import { Component, inject, type OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../core/services/Auth/auth.service.js';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  private _AuthService = inject(AuthService);
  resMessage: string = '';

  changePasswordForm: FormGroup = new FormGroup(
    {
      oldPassword: new FormControl(null, [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/),
      ]),
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

  changePassword() {
    if (this.changePasswordForm.valid) {
      // 1. Extract only the fields you want to send
      const { oldPassword, password } = this.changePasswordForm.value;

      // 2. Create the payload object (rename 'password' to 'newPassword' if your backend requires it)
      const payload = {
        password: oldPassword,
        newPassword: password, // or newPassword: password, depending on your API
      };

      // 3. Send the payload to your service
      this._AuthService.ChangePassword(payload).subscribe({
        next: (res) => {
          localStorage.setItem('token', res.data.token);
          console.log('Password Changed Successfully');
        },
        error: (err) => {
          console.log(err);
          this.resMessage = err.error.message;
        },
      });
    }
  }
}
