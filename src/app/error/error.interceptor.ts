import { Injectable } from '@angular/core';

import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';

import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/** Material Snackbar */
import { SnackbarService } from './snackbar.service';

import { AuthService } from '../auth/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private _snackbarService: SnackbarService,
    private _authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        console.log(event);

        /** 15102020 - Gaurav - Intercept Apollo client errors for GRAPHQL
         * For a test error from the graphql server from the query resolver =>
         * catchError did not work below,
         * catchError did not work in the pipe of watchQuery,
         * the error part of the subscribe method did not trigger,
         * onError did not work
         * ouside of the apollo-client init in app.module.ts, etc.
         *
         * Tried different ways for this existing angular http-interceptor to catch the graphql error
         * and show the message in the UI.
         * Caught the error successfully inside the onError call for apollo-client from app.module.ts but throwing HttpErrorResponse from there did not work as expected.
         *
         * Finally, what worked is the code below -
         * interecepting the HttpResponse event,
         * checking for the graphql url request,
         * checking errors array is there
         * and then throwing an HttpErrorResponse.
         *
         * And, finally, the catchError below worked as expected for graphQL query errors.
         *
         * This was a CRUCIAL part for graphql error handling.
         */
        if (
          event instanceof HttpResponse &&
          event.url === 'http://localhost:4000/graphql' &&
          event.body?.errors?.length > 0
        ) {
          throw new HttpErrorResponse({
            error: event.body.errors[0],
            headers: event.headers,
            status: 500,
            statusText: 'Warning',
            url: event.url,
          });
        }

        return event;
      }),
      catchError((httpError: HttpErrorResponse) => {
        let errorMessage =
          'An unknown error occurred! Either the server may be down or restarting or you may be facing network issues, please refresh page after some time. If issue persists, please contact this webpage administrator or your network provider.';

        !navigator.onLine &&
          (errorMessage = 'Please check your network connection and try again');

        if (httpError.error.message) {
          errorMessage = httpError.error.message;
          if (errorMessage.includes('Please try signing-in again')) {
            this._authService.logout();
          }
        }

        this._snackbarService.showError(errorMessage, 9000);

        return throwError(httpError);
      })
    );
  }
}
