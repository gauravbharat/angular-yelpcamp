import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

/** Auth service */
import { AuthService } from '../auth.service';

/** Material Snackbar */
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SnackBarComponent } from '../../error/snackbar.component';
import { configSuccess, configFailure } from '../../error/snackbar.config';

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
    private _snackbar: MatSnackBar,
    private _route: ActivatedRoute
  ) {
    this._route.params.subscribe((param) => {
      this.token = param.resetToken;
    });
  }

  onSubmit(form: NgForm) {
    if (form.invalid) return;
    if (!form.value.password || !form.value.password2) return;

    if (form.value.password !== form.value.password2) {
      this.showFlashMessage(
        'Both password fields should match!',
        configFailure
      );
      return;
    }

    this.isLoading = true;

    this._authService
      .resetPassword(this.token, form.value.password)
      .then((success) => {
        this.isLoading = false;
        if (success) {
          this.showFlashMessage(
            'Password reset! Please login with your new password.',
            configSuccess
          );
        }
      })
      .catch((error) => {
        // do nothing, handled in http error interceptor
        this.isLoading = false;
      });
  }

  showFlashMessage(message: string, config: MatSnackBarConfig) {
    this._snackbar.openFromComponent(SnackBarComponent, {
      data: message,
      ...config,
    });
  }
}
