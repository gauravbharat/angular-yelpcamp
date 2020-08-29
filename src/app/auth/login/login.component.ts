import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';

/** Auth service */
import { AuthService } from '../auth.service';

/** Material Snackbar */
import { SnackbarService } from '../../error/snackbar.service';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoading = false;
  hide = true;
  email: string;
  username: string;

  private authStatusSub$: Subscription;

  constructor(
    private authService: AuthService,
    private _snackbarService: SnackbarService
  ) {}

  ngOnInit() {
    // console.trace('login component loaded');

    this.authStatusSub$ = this.authService.getAuthStatusListener().subscribe(
      (authStatus) => {
        if (authStatus.isUserAuthenticated) {
          this._snackbarService.showSuccess(
            `Welcome to YelpCamp, ${authStatus.username}!`
          );
          this.authService.redirectToCampgrounds();
        }

        /** Now handled by global ErrorInteceptor
        if (authStatus.error) {
          this.showFlashMessage(authStatus.error, configFailure);
        } */

        // listen to auth status change, which should happen on calling the auth service login
        // method in onLogin() below. Success or failure, stop the loading spinner/progress-bar
        this.isLoading = false;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  ngOnDestroy() {
    this.authStatusSub$.unsubscribe();
  }

  onLogin(form: NgForm) {
    if (form.invalid) return;
    if (!form.value.email && !form.value.username) return;

    this.isLoading = true;
    this.authService.login(
      form.value.username,
      form.value.email,
      form.value.password
    );
  }

  onForgotPassword(form: NgForm) {
    if (!form.value.email) {
      this._snackbarService.showError(
        `Please enter your email to receive password reset instructions!`
      );
      return;
    }
    this.isLoading = true;
    this.authService.requestResetPassword(form.value.email).subscribe(
      (result) => {
        this.isLoading = false;
        this._snackbarService.showSuccess(result.message);
      },
      (error) => {
        // do nothing, handled in http error interceptor
        this.isLoading = false;
      }
    );
  }
}
