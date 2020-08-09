/** HttpInterceptors, a feature offered by Angular HttpClient.
 * HttpInterceptors are just functions which run on any incoming or outgoing http requests.
 * And here we can manipulate this outgoing requests to attach the auth token to authorize
 * user actions on backend API.
 *
 * Add this interceptor service in the Providers array inside App modules,
 * instead of adding it as 'providedIn' */

import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
} from '@angular/common/http';

import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInteceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const authToken = this.authService.getToken();

    /** Clone and manipulate the request instead of directly changing it to
     * avoid any unwanted side-effects.
     * Pass configuration to clone, to edit the clone */
    const authRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`),
    });

    return next.handle(authRequest);
  }
}
