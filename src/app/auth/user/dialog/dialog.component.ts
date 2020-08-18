/** Dialog for user avatar change */
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AuthService } from '../../auth.service';
import { NgForm } from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from '../../../error/snackbar.component';
import { configSuccess } from '../../../error/snackbar.config';

@Component({
  selector: 'ay-image-dialog',
  templateUrl: './image-dialog.component.html',
})
export class ImageDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ImageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'ay-password-dialog',
  templateUrl: './password-dialog.component.html',
})
export class PasswordDialogComponent {
  isLoading = false;
  isPasswordUpdated = false;
  hide = true;

  constructor(
    public dialogRef: MatDialogRef<ImageDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { userId: string },
    private authService: AuthService,
    private _snackbar: MatSnackBar
  ) {
    dialogRef.disableClose = true;
  }

  onUpdate(form: NgForm) {
    if (!form.valid) return;

    let validationError;

    form.value.oldpassword.trim() === '' &&
      (validationError = true) &&
      form.controls.oldpassword.reset();

    form.value.newpassword.trim() === '' &&
      (validationError = true) &&
      form.controls.newpassword.reset();

    if (validationError) {
      validationError = false;
      this._snackbar.openFromComponent(SnackBarComponent, {
        data: 'Please enter valid password!',
        ...configSuccess,
      });

      return;
    }

    this.isLoading = true;

    this.authService
      .updateUserPassword(
        this.data.userId,
        form.value.oldpassword,
        form.value.newpassword
      )
      .then((result) => {
        // console.log(result);
        this.isLoading = false;
        this.dialogRef.close({
          isPasswordUpdated: true,
          message: 'Password changed!',
        });
      })
      .catch((error) => {
        console.log(error);
        this.isLoading = false;
      });
  }

  onNoClick(): void {
    this.dialogRef.close({
      isPasswordUpdated: false,
      message: '',
    });
  }
}
