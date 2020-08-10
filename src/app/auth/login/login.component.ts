import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';

/** Auth service */
import { AuthService } from '../auth.service';

/** Material Snackbar */
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
  MatSnackBarRef,
} from '@angular/material/snack-bar';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoading = false;
  hide = true;

  private authStatusSub$: Subscription;

  /** Material Snackbar */
  private horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  private verticalPosition: MatSnackBarVerticalPosition = 'top';
  private matSnackBarRef: MatSnackBarRef<any>;

  constructor(
    private authService: AuthService,
    private _snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    this.authStatusSub$ = this.authService.getAuthStatusListener().subscribe(
      (authStatus) => {
        /** 09082020 - Snackbar specific code */
        if (authStatus.isUserAuthenticated) {
          this.showFlashMessage(`Welcome to YelpCamp, ${authStatus.username}!`);
        }
        if (authStatus.error) {
          this.showFlashMessage(authStatus.error);
        }

        // listen to auth status change, which should happen on calling the auth service login
        // method in onLogin() below. Success or failure, stop the loading spinner/progress-bar
        this.isLoading = false;
      },
      (error) => {
        console.log(error);
        this.showFlashMessage('Error logging in!');
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
  showFlashMessage(message: string) {
    this.matSnackBarRef = this._snackbar.open(message, 'x', {
      duration: 3000,
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
    });

    this.matSnackBarRef.onAction().subscribe(() => {
      this.matSnackBarRef.dismiss();
    });
  }
}
