import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

/** Auth service */
import { AuthService } from '../auth.service';

/** Material Snackbar */
import { SnackbarService } from '../../error/snackbar.service';

@Component({
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent {
  isLoading = false;
  hide = true;
  private token: string;

  constructor(
    private _authService: AuthService,
    private _route: ActivatedRoute,
    private _snackbarService: SnackbarService
  ) {
    this._route.params.subscribe((param) => {
      this.token = param.resetToken;
    });
  }

  onSubmit(form: NgForm) {
    if (form.invalid) return;
    if (!form.value.password || !form.value.password2) return;

    if (form.value.password !== form.value.password2) {
      this._snackbarService.showError('Both password fields should match!');
      return;
    }

    this.isLoading = true;

    this._authService
      .resetPassword(this.token, form.value.password)
      .then((success) => {
        this.isLoading = false;
        if (success) {
          this._snackbarService.showSuccess(
            'Password reset! Please login with your new password.'
          );
        }
      })
      .catch((error) => {
        // do nothing, handled in http error interceptor
        this.isLoading = false;
      });
  }
}
