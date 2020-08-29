/** 29082020 - Gaurav - Centralized code and created SnackBar Service */
import { Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

import { SnackBarComponent } from './snackbar.component';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private _horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  private _verticalPosition: MatSnackBarVerticalPosition = 'top';

  constructor(
    private _snackBar: MatSnackBar,
    private _breakpointObserver: BreakpointObserver
  ) {
    /** Show the snack bar at the bottom if the user screen is that of mobile */
    const isSmallScreen = _breakpointObserver.isMatched('(max-width: 500px)');

    if (isSmallScreen) {
      this._verticalPosition = 'bottom';
    }
  }

  showSuccess(message: string, duration?: number) {
    const configSuccess: MatSnackBarConfig = {
      panelClass: 'style-success',
      duration: duration ? duration : 3000,
      horizontalPosition: this._horizontalPosition,
      verticalPosition: this._verticalPosition,
    };

    this._snackBar.openFromComponent(SnackBarComponent, {
      data: message,
      ...configSuccess,
    });
  }

  showError(message: string, duration?: number) {
    const configFailure: MatSnackBarConfig = {
      panelClass: 'style-error',
      duration: duration ? duration : 5000,
      horizontalPosition: this._horizontalPosition,
      verticalPosition: this._verticalPosition,
    };

    this._snackBar.openFromComponent(SnackBarComponent, {
      data: message,
      ...configFailure,
    });
  }
}
