import {
  MatSnackBarConfig,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

const horizontalPosition: MatSnackBarHorizontalPosition = 'center';
const verticalPosition: MatSnackBarVerticalPosition = 'top';

export const configSuccess: MatSnackBarConfig = {
  panelClass: 'style-success',
  duration: 3000,
  horizontalPosition,
  verticalPosition,
};

export const configFailure: MatSnackBarConfig = {
  panelClass: 'style-error',
  duration: 5000,
  horizontalPosition,
  verticalPosition,
};
