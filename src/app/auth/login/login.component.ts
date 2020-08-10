import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';

/** Auth service */
import { AuthService } from '../auth.service';

/** Material Snackbar */
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SnackBarComponent } from '../../error/snackbar.component';
import { configSuccess, configFailure } from '../../error/snackbar.config';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoading = false;
  hide = true;

  private authStatusSub$: Subscription;

  constructor(
    private authService: AuthService,
    private _snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    this.authStatusSub$ = this.authService.getAuthStatusListener().subscribe(
      (authStatus) => {
        /** 09082020 - Snackbar specific code */
        if (authStatus.isUserAuthenticated) {
          this.showFlashMessage(
            `Welcome to YelpCamp, ${authStatus.username}!`,
            configSuccess
          );
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

  /** 09082020 - Snackbar specific code */
  showFlashMessage(message: string, config: MatSnackBarConfig) {
    this._snackbar.openFromComponent(SnackBarComponent, {
      data: message,
      ...config,
    });
  }
}
