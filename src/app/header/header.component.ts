import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isUserAuthenticated = false;
  private authStatusSub$: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    /** Set flag on privileged access of select controls */
    this.authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe(
        (authStatus) =>
          (this.isUserAuthenticated = authStatus.isUserAuthenticated)
      );
  }

  ngOnDestroy() {
    this.authStatusSub$.unsubscribe();
  }

  onLogout() {
    this.authService.logout();
  }
}
