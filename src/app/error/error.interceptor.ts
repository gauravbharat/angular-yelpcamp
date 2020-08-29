import { Injectable } from '@angular/core';

import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
} from '@angular/common/http';

import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/** Material Snackbar */
import { SnackbarService } from './snackbar.service';

import { AuthService } from '../auth/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private _snackbarService: SnackbarService,
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((httpError: HttpErrorResponse) => {
        let errorMessage =
          'An unknown error occurred! Either the server may be down or restarting or you may be facing network issues, please refresh page after some time. If issue persists, please contact this webpage administrator or your network provider.';

        if (httpError.error.message) {
          errorMessage = httpError.error.message;
          if (errorMessage.includes('Please try signing-in again')) {
            this.authService.logout();
          }
        }

        this._snackbarService.showError(errorMessage, 9000);

        return throwError(httpError);
      })
    );
  }
}
