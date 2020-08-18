/** 11082020 - Added Route Guard
 * Add CanActivate interface to protect routes from unauthorized access
 * using browser address bar
 * Add this service as a provider in the App Routing module
 *
 * 18082020 - Refactored to return a Promise of boolean,
 * fixed a bug of app randomly showing the login page, for Auth Guard routes,
 * even when the user was authenticated.
 * Had to use async-await to hold on checking the auth status and returning a
 * value for the Auth Guard to proceed.
 * OnInit was not triggered, but canActivate at first alwasys*/

import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private authStatusSub$: Subscription;
  private isUserAuthenticated = false;

  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    this.authStatusSub$ = await this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isUserAuthenticated = authStatus.isUserAuthenticated;

        // console.log('inside canActivate()', this.isUserAuthenticated);
        if (!this.isUserAuthenticated) {
          this.router.navigate(['/auth/login']);
        }
      });

    await this.authStatusSub$.unsubscribe();
    return new Promise((resolve) => {
      resolve(this.isUserAuthenticated);
    });
  }
}
