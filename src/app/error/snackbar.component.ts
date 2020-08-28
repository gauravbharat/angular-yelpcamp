import { Component, Inject } from '@angular/core';

/** Material Snackbar */
import {
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
} from '@angular/material/snack-bar';

@Component({
  selector: 'app-snack-bar',
  template: `
    <div style="snack-bar-container">
      <span class="snakbar-data">{{ data }} </span>
      <span class="snackbar-action-button" (click)="matSnackBarRef.dismiss()">
        &#10006;
      </span>
    </div>
  `,
  styles: [
    `
      div {
        display: flex;
        justify-content: space-between;
      }

      .snackbar-action-button {
        cursor: pointer;
      }

      ::ng-deep snack-bar-container.style-success {
        color: #155724;
        background-color: #d4edda;
        border-color: #c3e6cb;
      }

      ::ng-deep snack-bar-container.style-error {
        color: #721c24;
        background-color: #f8d7da;
        border-color: #f5c6cb;
      }
    `,
  ],
})
export class SnackBarComponent {
  constructor(
    public matSnackBarRef: MatSnackBarRef<SnackBarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any
  ) {}
}
