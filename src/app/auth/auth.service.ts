import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';

/** 16102020 - Gaurav - GraphQL API changes */
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { fragments } from './auth.graphql';
import { map } from 'rxjs/operators';

import {
  AuthData,
  RegisterUser,
  CurrentUser,
  UserSettingsUpdate,
} from './auth-data.model';
import { environment } from '../../environments/environment';

const BACKEND_URL = `${environment.apiUrl}/users`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  mutateObs: Observable<any>;

  private readonly indexedDbStore = 'currentUser';
  private readonly UPDATE_USER = 'UPDATE_USER';
  private readonly RESET_USER = 'RESET_USER';

  private isAuthenticated = false;
  private currentUser: CurrentUser | null;
  private currentUrl: string;

  // Set listener for auth status change, initialize to false
  private _authStatusListener = new BehaviorSubject<{
    isUserAuthenticated: boolean;
    username: string;
    userId: string;
    userAvatar: string;
    userFirstName: string;
    unreadNotifications: number;
    hideStatsDashboard: boolean;
    error: string;
  }>({
    isUserAuthenticated: false,
    username: null,
    userId: null,
    userAvatar: null,
    userFirstName: null,
    unreadNotifications: 0,
    hideStatsDashboard: false,
    error: null,
  });

  private userUpdateListener = new BehaviorSubject<{
    updatedUser: CurrentUser | null;
  }>({
    updatedUser: null,
  });

  constructor(
    private http: HttpClient,
    private router: Router,
    private dbService: NgxIndexedDBService,
    private _apollo: Apollo
  ) {
    /** Get the current url to navigate user to campgrounds page on logout ONLY IF
     * user is on the camgpround create or edit form page
     */
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.url;
      }
    });
  }

  getToken() {
    return this.currentUser?.token;
  }
  getUserId() {
    return this.currentUser?.userId;
  }

  getAuthStatusListener() {
    return this._authStatusListener.asObservable();
  }

  getUserUpdatesListener() {
    return this.userUpdateListener.asObservable();
  }

  register(userData: RegisterUser) {
    const GET_AUTH_PAYLOAD = gql`
      mutation GetAuthPayload($userData: RegisterUserInput!) {
        register(registrationData: $userData) {
          token
          expiresIn
          user {
            ...UserBasicInfo
            ...UserSettings
          }
        }
      }

      ${fragments.User.UserBasicInfo}
      ${fragments.User.UserSettings}
    `;

    this.mutateObs =
      environment.useApi === 'GRAPHQL'
        ? this._apollo
            .mutate<{ data: { register: any } }>({
              mutation: GET_AUTH_PAYLOAD,
              variables: {
                userData,
              },
            })
            .pipe(map(({ data: register }) => register))
        : this.http.post<{ message: string; newUser: CurrentUser }>(
            `${BACKEND_URL}/signup`,
            userData
          );

    return new Promise((resolve, reject) => {
      this.mutateObs.subscribe(
        (result: any) => {
          console.log(result);
          if (environment.useApi === 'GRAPHQL') {
            this.currentUser = {
              userId: result.register.user._id,
              email: result.register.user.email,
              username: result.register.user.username,
              firstname: result.register.user.firstName,
              lastname: result.register.user.lastName,
              isAdmin: true,
              avatar: result.register.user.avatar,
              isPublisher: true,
              enableNotifications: {
                newCampground:
                  result.register.user.enableNotifications.newCampground,
                newComment: result.register.user.enableNotifications.newComment,
                newFollower:
                  result.register.user.enableNotifications.newFollower,
                newCommentLike:
                  result.register.user.enableNotifications.newCommentLike,
              },
              enableNotificationEmails: {
                system:
                  result.register.user.enableNotificationEmails.newCampground,
                newCampground:
                  result.register.user.enableNotificationEmails.newCampground,
                newComment:
                  result.register.user.enableNotificationEmails.newCampground,
                newFollower:
                  result.register.user.enableNotificationEmails.newCampground,
              },
              hideStatsDashboard: result.register.user.hideStatsDashboard,
              token: result.register.token,
              expiresIn: result.register.expiresIn,
            };
          } else {
            this.currentUser = result.newUser;
          }
          this._updateListeners(this.UPDATE_USER, false, null);
          this.setTimerAndStorage();
          this.router.navigate(['/campgrounds']);
          // resolve({ success: true, message: 'User created!' });
        },
        (error) => {
          // console.log('error in user signup', error);
          this.currentUser = null;
          this._updateListeners(
            this.RESET_USER,
            false,
            'Error in registration process!'
          );
          reject({ success: false, message: error?.message });
        }
      );
    });
  }

  login(username: string, email: string, password: string) {
    const authData: AuthData = {
      username,
      email,
      password,
    };

    const GET_AUTH_PAYLOAD = gql`
      mutation GetAuthPayload($credentials: LoginUserInput!) {
        login(credentials: $credentials) {
          expiresIn
          token
          user {
            ...UserBasicInfo
            ...UserSettings
            followers {
              _id
            }
            isAdmin
            notifications {
              _id
              campgroundId {
                _id
                name
              }
              commentId {
                _id
                text
              }
              createdAt
              updatedAt
              isCommentLike
              isRead
              notificationType
              notificationTypeDesc

              userId {
                _id
                username
                avatar
              }
              follower {
                id {
                  _id
                  username
                  avatar
                }
                followingUserId {
                  _id
                  username
                  avatar
                }
              }
            }
          }
        }
      }

      ${fragments.User.UserBasicInfo}
      ${fragments.User.UserSettings}
    `;

    return new Promise((resolve, reject) => {
      this.mutateObs =
        environment.useApi === 'GRAPHQL'
          ? this._apollo
              .mutate<{ login: any }>({
                mutation: GET_AUTH_PAYLOAD,
                variables: {
                  credentials: {
                    ...authData,
                  },
                },
              })
              .pipe(
                map(({ data: { login } }) => {
                  return {
                    userData: {
                      token: login.token,
                      expiresIn: login.expiresIn,
                      ...login.user,
                      userId: login.user._id,
                      firstname: login.user.firstName,
                      lastname: login.user.lastName,
                      followers: login.user.followers.map(
                        (follower) => follower._id
                      ),
                    },
                  };
                })
              )
          : this.http.post<{ message: string; userData: CurrentUser }>(
              `${BACKEND_URL}/login`,
              authData
            );

      this.mutateObs.subscribe(
        (response) => {
          this.currentUser = response.userData;
          this._updateListeners(this.UPDATE_USER, false, null);
          this.setTimerAndStorage();
          this.router.navigate(['/campgrounds']);
          resolve({ isSuccess: true, username: this.currentUser.username });
        },
        (error) => {
          console.log('this.mutateObs.subscribe error', error);
          this.currentUser = null;
          this._updateListeners(
            this.RESET_USER,
            false,
            'Login failed, invalid credentials!'
          );
          reject({ isSuccess: false, error });
        }
      );
    });
  }

  logout() {
    clearTimeout(this.currentUser?.tokenTimer);
    this.clearAuthData();
    this.currentUser = null;
    this._updateListeners(this.RESET_USER, false, null);

    /** On logout, navigate user away from following pages -
     * create/edit campground
     * ANY user details page */
    if (
      this.currentUrl?.includes('/campgrounds/process/') ||
      this.currentUrl?.includes('/user')
    ) {
      this.router.navigate(['/campgrounds']);
    }
  }

  /** User UPDATE specific requests, from user component. Because we need to update the central data
   * as well as push latest data to the observers
   */
  updateUserAvatar(userId: string, avatar: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.mutateObs =
        environment.useApi === 'GRAPHQL'
          ? this._apollo.mutate({
              mutation: gql`
                mutation ChangeUserAvatar($avatar: String!) {
                  updateUserAvatar(avatar: $avatar)
                }
              `,
              variables: {
                avatar,
              },
            })
          : this.http.put<{ message: string }>(`${BACKEND_URL}/avatar/me`, {
              userId,
              avatar,
            });

      this.mutateObs.subscribe(
        (result) => {
          this.currentUser.avatar = avatar;
          // Update the local store as well
          this._updateListeners(this.UPDATE_USER, true, null);
          resolve('User avatar updated!');
        },
        (error) => {
          console.log('authservice: update user avatar', error);
          reject('Error updating user avatar!');
        }
      );
    });
  }

  updateUserData(userData: UserSettingsUpdate): Promise<string> {
    return new Promise((resolve, reject) => {
      // 18102020 - Gaurav - GraphQL changes
      this.mutateObs =
        environment.useApi === 'GRAPHQL'
          ? this._apollo.mutate({
              mutation: gql`
                mutation UpdateUserSettings(
                  $userData: UserSettingsUpdateInput!
                ) {
                  updateUserSettings(userData: $userData)
                }
              `,
              variables: {
                userData,
              },
            })
          : this.http.put<{ message: string }>(`${BACKEND_URL}/detail/me`, {
              userData,
            });

      this.mutateObs.subscribe(
        (result) => {
          this.currentUser.firstname = userData.firstname;
          this.currentUser.lastname = userData.lastname;
          this.currentUser.email = userData.email;
          this.currentUser.hideStatsDashboard = userData.hideStatsDashboard;
          this.currentUser.enableNotifications.newCampground =
            userData.enableNotifications.newCampground;
          this.currentUser.enableNotifications.newComment =
            userData.enableNotifications.newComment;
          this.currentUser.enableNotifications.newFollower =
            userData.enableNotifications.newFollower;
          this.currentUser.enableNotifications.newCommentLike =
            userData.enableNotifications.newCommentLike;
          this.currentUser.enableNotificationEmails.newCampground =
            userData.enableNotificationEmails.newCampground;
          this.currentUser.enableNotificationEmails.newComment =
            userData.enableNotificationEmails.newComment;
          this.currentUser.enableNotificationEmails.newFollower =
            userData.enableNotificationEmails.newFollower;

          // Update the local store as well
          this._updateListeners(this.UPDATE_USER, true, null);
          resolve('User update successful!');
        },
        (error) => {
          reject('User update failed!');
        }
      );
    });
  }

  updateUserPassword(
    userId: string,
    oldpass: string,
    newpass: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.mutateObs =
        environment.useApi === 'GRAPHQL'
          ? this._apollo.mutate({
              mutation: gql`
                mutation ChangeUserPassword(
                  $oldpass: String!
                  $newpass: String!
                ) {
                  updateUserPassword(
                    oldPassword: $oldpass
                    newPassword: $newpass
                  )
                }
              `,
              variables: {
                oldpass,
                newpass,
              },
            })
          : this.http.put<{ message: string }>(`${BACKEND_URL}/pwd/me`, {
              userId,
              oldpass,
              newpass,
            });

      this.mutateObs.subscribe(
        (response) => {
          resolve('Password changed!');
        },
        (error) => {
          console.log('auth: user pw change', error);
          reject(error.message);
        }
      );
    });
  }

  updateNotification(notificationIdArr: string[], isSetRead: boolean) {
    this.mutateObs =
      environment.useApi === 'GRAPHQL'
        ? this._apollo.mutate({
            mutation: gql`
              mutation UpdateNotification(
                $notificationIdArr: [ID!]!
                $isSetRead: Boolean!
              ) {
                updateNotification(
                  notificationIdArr: $notificationIdArr
                  isSetRead: $isSetRead
                )
              }
            `,
            variables: {
              notificationIdArr,
              isSetRead,
            },
          })
        : this.http.put<{ message: string }>(
            `${BACKEND_URL}/notifications/update`,
            {
              notificationIdArr,
              isSetRead,
            }
          );

    return this.mutateObs;
  }

  deleteNotification(notificationIdArr: string[]) {
    this.mutateObs =
      environment.useApi === 'GRAPHQL'
        ? this._apollo.mutate({
            mutation: gql`
              mutation DeleteNotification($notificationIdArr: [ID!]!) {
                deleteNotification(notificationIdArr: $notificationIdArr)
              }
            `,
            variables: {
              notificationIdArr,
            },
          })
        : this.http.post<{ message: string }>(
            `${BACKEND_URL}/notifications/remove`,
            {
              notificationIdArr,
            }
          );

    return this.mutateObs;
  }

  async resetNotifications(
    notificationIdArr: string[],
    isSetRead: boolean,
    action: string
  ) {
    if (action === 'UPDATE') {
      // NOTIFICATION UPDATED - refresh notification array
      await this.currentUser.notifications.forEach((notification) => {
        if (notificationIdArr.includes(notification._id)) {
          notification.isRead = isSetRead;
        }
      });

      // Update the local store as well
      this._updateListeners(this.UPDATE_USER, true, null);
    } else {
      // NOTIFICATION DELETED - refresh notification array
      this.currentUser.notifications = await this.currentUser.notifications.filter(
        (notification) => !notificationIdArr.includes(notification._id)
      );

      // Update the local store as well
      this._updateListeners(this.UPDATE_USER, true, null);
    }
  }

  /** Update User Specific Requests - ENDs */

  /** User password reset methods - Start */
  requestResetPassword(email: string) {
    this.mutateObs =
      environment.useApi === 'GRAPHQL'
        ? this._apollo.mutate<{ message: string }>({
            mutation: gql`
              mutation InitiateResetPassword($email: String!) {
                createResetToken(email: $email) {
                  message
                }
              }
            `,
            variables: {
              email,
            },
          })
        : this.http.post<{ message: string }>(`${BACKEND_URL}/reset`, {
            email,
          });

    return this.mutateObs;
  }

  verifyTokenValidity(token: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mutateObs =
        environment.useApi === 'GRAPHQL'
          ? this._apollo.mutate({
              mutation: gql`
                mutation VerifyPasswordResetToken($token: String!) {
                  verifyResetToken(token: $token)
                }
              `,
              variables: {
                token,
              },
            })
          : this.http.get(`${BACKEND_URL}/reset/${token}`);

      this.mutateObs.subscribe(
        (result) => {
          resolve(true);
        },
        (error) => {
          reject(false);
          this.router.navigate(['/']);
        }
      );
    });
  }

  resetPassword(token: string, newpw: string) {
    return new Promise<boolean>((resolve, reject) => {
      this.mutateObs =
        environment.useApi === 'GRAPHQL'
          ? this._apollo.mutate({
              mutation: gql`
                mutation CompleteResetPasswordProcess(
                  $token: String!
                  $newpw: String!
                ) {
                  resetPassword(token: $token, newPassword: $newpw)
                }
              `,
              variables: {
                token,
                newpw,
              },
            })
          : this.http.post(`${BACKEND_URL}/reset/${token}`, {
              newpw,
            });

      this.mutateObs.subscribe(
        (result) => {
          resolve(true);
          if (this.isAuthenticated) this.logout();
          this.router.navigate(['/auth/login']);
        },
        (error) => {
          reject(false);
        }
      );
    });
  }
  /** User password reset methods - Ends */

  /** Auto-login user if we have the auth-data available in localStorage
   * But check that the token is not expired
   * Call this from app component
   */
  async autoLoginUser() {
    const authInformation = await this.getAuthData();
    if (authInformation) {
      const now = new Date();
      const expiresIn =
        authInformation.expirationDate.getTime() - now.getTime();
      if (expiresIn > 0) {
        // if token is not expired yet
        this.dbService.getByKey(this.indexedDbStore, 1).then(
          async (userData) => {
            // console.log("this.dbService.getByKey('currentUser', 1)", userData);
            if (userData) {
              this.currentUser = userData;
              await this._updateListeners(this.UPDATE_USER, false, null);
              // this.setTimerAndStorage(); //BUG - conflicts with JWT token expiry
              // this.router.navigate(['/campgrounds']); //bug

              return;
            }
          },
          (error) => {
            console.log(
              "error getting persisted user login from user's browser",
              error
            );
            return this.logout();
          }
        );
      }
    } else {
      return this.logout();
    }
  }

  private setTimerAndStorage() {
    // Logout user after token expiry
    this.setAuthTimer(this.currentUser.expiresIn);

    //Persist login data in localStorage
    const now = new Date();
    const expirationDate = new Date(
      now.getTime() + this.currentUser.expiresIn * 1000
    );
    this.clearAuthData();
    this.saveAuthData(
      this.currentUser.token,
      expirationDate,
      this.currentUser.userId
    );
  }

  /** Force logout user on token expiry */
  private setAuthTimer(duration: number) {
    this.currentUser.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  /** localStorage and indexedDB specific code */
  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    localStorage.setItem('token', token);
    //serialized expiration date stored
    localStorage.setItem('expiration', expirationDate.toISOString());
    localStorage.setItem('userId', userId);

    // Store
    this.currentUser.id = 1; // for indexedDB keyPath
    this.dbService.add(this.indexedDbStore, this.currentUser).then(
      () => {
        // console.log('valued added in indexedDB');
      },
      (error) => {
        console.log("error persisting user login in user's browser", error);
      }
    );
  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiration');
    localStorage.removeItem('userId');
    this.dbService.delete(this.indexedDbStore, 1).then(
      () => {},
      (error) => {
        console.log(
          "error deleting persisted user login from user's browser",
          error
        );
      }
    );
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expiration');
    const userId = localStorage.getItem('userId');

    if (!token || !expirationDate) {
      return;
    }

    // De-serialize expiration date
    return {
      token,
      expirationDate: new Date(expirationDate),
      userId,
    };
  }

  private _updateAuthData() {
    this.dbService
      .update(this.indexedDbStore, this.currentUser)
      .then((result) => {
        // console.log(result);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  private _updateListeners(
    update: string,
    updateLocalStore: boolean,
    error: any
  ): void {
    // isAuthenticated TRUE, as long as this.UPDATE_USER is sent
    this.isAuthenticated = update === this.UPDATE_USER;

    if (this.isAuthenticated) {
      const unreadNotifications = this.currentUser?.notifications?.filter(
        (notification) => notification.isRead === false
      );

      // console.log('unreadNotifications', unreadNotifications);

      this._authStatusListener.next({
        isUserAuthenticated: this.isAuthenticated,
        username: this.currentUser.username,
        userId: this.currentUser.userId,
        userAvatar: this.currentUser.avatar,
        userFirstName: this.currentUser.firstname,
        unreadNotifications: unreadNotifications
          ? unreadNotifications.length
          : 0,
        hideStatsDashboard: this.currentUser.hideStatsDashboard,
        error,
      });
      this.userUpdateListener.next({
        updatedUser: this.currentUser,
      });
    } else {
      this._authStatusListener.next({
        isUserAuthenticated: false,
        username: null,
        userId: null,
        userAvatar: null,
        userFirstName: null,
        unreadNotifications: 0,
        hideStatsDashboard: false,
        error,
      });
      this?.userUpdateListener.next({
        updatedUser: null,
      });
    }

    /** UPDATE local store as well for the latest current user values */
    updateLocalStore && this._updateAuthData();
  }

  redirectToCampgrounds() {
    this.router.navigate(['/campgrounds']);
  }
}
