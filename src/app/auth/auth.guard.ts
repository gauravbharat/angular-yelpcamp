/** 11082020 - Added Route Guard
 * Add CanActivate interface to protect routes from unauthorized access
 * using browser address bar
 * Add this service as a provider in the App Routing module */

import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    const isUserAuthenticated = this.authService.getIsAuth();
    if (!isUserAuthenticated) {
      this.router.navigate(['/auth/login']);
    }

    return isUserAuthenticated;
  }
}
