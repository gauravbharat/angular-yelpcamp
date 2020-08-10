import { Injectable } from '@angular/core';

import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
} from '@angular/common/http';

import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from './snackbar.component';
import { configFailure } from './snackbar.config';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private _snackbar: MatSnackBar) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((httpError: HttpErrorResponse) => {
        let errorMessage = 'An unknown error occurred!';

        if (httpError.error.message) {
          errorMessage = httpError.error.message;
        }

        this._snackbar.openFromComponent(SnackBarComponent, {
          data: errorMessage,
          ...configFailure,
        });

        return throwError(httpError);
      })
    );
  }
}
