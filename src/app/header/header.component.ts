import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  animations: [
    trigger('inAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1s ease-out', style({ opacity: 1 })),
      ]),
      // transition(':leave', [
      //   style({ opacity: 1 }),
      //   animate('1s ease-in', style({ opacity: 0 })),
      // ]),
    ]),
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoading = false;
  isUserAuthenticated = false;
  notificationsCount = 0;
  username: string;
  avatar: string;
  private authStatusSub$: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.isLoading = true;
    /** Set flag on privileged access of select controls */
    this.authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isUserAuthenticated = authStatus.isUserAuthenticated;
        this.username = authStatus.username;
        this.avatar = authStatus.userAvatar;
        this.notificationsCount = authStatus.unreadNotifications;
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.authStatusSub$.unsubscribe();
  }

  onLogout() {
    this.authService.logout();
  }
}
