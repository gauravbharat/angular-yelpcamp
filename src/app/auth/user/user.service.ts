import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';

import { AuthService } from '../auth.service';

import { DisplayCoUser } from '../auth-data.model';
import { environment } from '../../../environments/environment';

const BACKEND_URL = `${environment.apiUrl}/users`;

@Injectable({ providedIn: 'root' })
export class UserService implements OnDestroy {
  tabs = Object.freeze({
    USER_SETTINGS: 'USER_SETTINGS',
    USER_CAMPGROUNDS: 'USER_CAMPGROUNDS',
    USER_NOTIFICATIONS: 'USER_NOTIFICATIONS',
  });

  private authStatusSub$: Subscription;
  private currentUserId: string;

  private coUserId: string;
  private _showOnInitTab = this.tabs.USER_CAMPGROUNDS;
  private _currentUrl: string;
  private _userRouteChangeListener = new BehaviorSubject<{
    showTab: string;
    showCoUser: boolean;
  }>({
    showTab: this.tabs.USER_CAMPGROUNDS,
    showCoUser: false,
  });

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    // Calling this subscription DID NOT work in ngOnInit()
    this.authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.currentUserId = authStatus.userId;
        // console.log('this.currentUserId', this.currentUserId);
      });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this._currentUrl = event.url;

        // console.log(this._currentUrl);

        const substr = this._currentUrl.substr(
          this._currentUrl.lastIndexOf('/') + 1
        );

        switch (substr) {
          case 'current':
            this._showOnInitTab = this.tabs.USER_SETTINGS;
            break;
          case 'notifications':
            this._showOnInitTab = this.tabs.USER_NOTIFICATIONS;
            break;
          default:
            this._showOnInitTab = this.tabs.USER_CAMPGROUNDS;
        }

        // This may be same when
        if (this._currentUrl.includes('/other')) {
          // this may happen if user had an /other with own id (a link in email)
          if (substr === this.currentUserId) {
            this.coUserId = null;
            router.navigate(['/user/current']);
          } else {
            this.coUserId = substr;
          }
        } else {
          this.coUserId = null;
        }

        this._userRouteChangeListener.next({
          showTab: this._showOnInitTab,
          showCoUser: !!this.coUserId,
        });
      }
    });
  }

  ngOnDestroy() {
    this.authStatusSub$?.unsubscribe();
  }

  getUserRouterChangeListener() {
    return this._userRouteChangeListener.asObservable();
  }

  getCoUserData() {
    return this.http.get<{
      message: string;
      coUserData: DisplayCoUser;
      userCampgrounds: [];
    }>(`${BACKEND_URL}/${this.coUserId}`);
  }

  getUserActivity(userId: string) {
    return this.http.get<{
      message: string;
      userCampgrounds: [];
      userComments: [];
    }>(`${BACKEND_URL}/activity/${userId}`);
  }

  toggleFollowUser(
    userToFollowId: string,
    followerUserId: string,
    follow: boolean
  ) {
    return this.http.post<{ message: string }>(`${BACKEND_URL}/follow`, {
      userToFollowId,
      followerUserId,
      follow,
    });
  }

  // getUserCampgrounds(userId: string) {
  //   //
  // }

  redirectToHomePage(): void {
    this.router.navigate(['/campgrounds']);
  }
}
