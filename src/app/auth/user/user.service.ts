import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Subscription, Observable } from 'rxjs';

import { AuthService } from '../auth.service';

import { DisplayCoUser } from '../auth-data.model';
import { environment } from '../../../environments/environment';

/** 16102020 - Gaurav - GraphQL API changes */
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';

const BACKEND_URL = `${environment.apiUrl}/users`;

@Injectable({ providedIn: 'root' })
export class UserService implements OnDestroy {
  tabs = Object.freeze({
    USER_SETTINGS: 'USER_SETTINGS',
    USER_CAMPGROUNDS: 'USER_CAMPGROUNDS',
    USER_NOTIFICATIONS: 'USER_NOTIFICATIONS',
  });

  UserActivityPayload: Observable<any>;
  CoUserDataPayload: Observable<any>;
  ToggleUserUpdate: Observable<any>;

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
    private authService: AuthService,
    private _apollo: Apollo
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
    if (environment.useApi === 'GRAPHQL') {
      this.CoUserDataPayload = this._apollo
        .watchQuery<{
          coUser: { coUserData: any; userCampgrounds: any };
        }>({
          query: gql`
            query GetCoUserDataPayload($userId: ID!) {
              coUser(_id: $userId) {
                coUserData {
                  coUserId
                  email
                  username
                  firstname
                  lastname
                  avatar
                  followers
                }
                userCampgrounds {
                  campgroundId
                  campgroundName
                }
              }
            }
          `,
          variables: {
            userId: this.coUserId,
          },
        })
        .valueChanges.pipe(map(({ data: { coUser } }) => coUser));

      return this.CoUserDataPayload;
    } else {
      return this.http.get<{
        message: string;
        coUserData: DisplayCoUser;
        userCampgrounds: [];
      }>(`${BACKEND_URL}/${this.coUserId}`);
    }
  }

  getUserActivity(userId: string) {
    if (environment.useApi === 'GRAPHQL') {
      this.UserActivityPayload = this._apollo
        .watchQuery<{
          userActivity: { userCampgrounds: any; userComments: any };
        }>({
          query: gql`
            query GetUserActivity {
              userActivity {
                userCampgrounds {
                  _id
                  name
                  createdAt
                }
                userComments {
                  _id
                }
              }
            }
          `,
        })
        .valueChanges.pipe(
          map(
            ({
              data: {
                userActivity: { userCampgrounds, userComments },
              },
            }) => {
              return {
                userCampgrounds: userCampgrounds.map((record) => {
                  return {
                    campgroundId: record._id,
                    campgroundName: record.name,
                    campgroundCreatedAt: record.createdAt,
                  };
                }),
                userComments,
              };
            }
          )
        );

      return this.UserActivityPayload;
    } else {
      return this.http.get<{
        message: string;
        userCampgrounds: [];
        userComments: [];
      }>(`${BACKEND_URL}/activity/${userId}`);
    }
  }

  toggleFollowUser(
    userToFollowId: string,
    followerUserId: string,
    follow: boolean
  ) {
    if (environment.useApi === 'GRAPHQL') {
      this.ToggleUserUpdate = this._apollo.mutate({
        mutation: gql`
          mutation ToggleFollowUser(
            $userToFollowId: String!
            $follow: Boolean!
          ) {
            toggleFollowUser(userToFollowId: $userToFollowId, follow: $follow)
          }
        `,
        variables: {
          userToFollowId,
          follow,
        },
      });

      return this.ToggleUserUpdate;
    } else {
      return this.http.post<{ message: string }>(`${BACKEND_URL}/follow`, {
        userToFollowId,
        followerUserId,
        follow,
      });
    }
  }

  redirectToHomePage(): void {
    this.router.navigate(['/campgrounds']);
  }
}
