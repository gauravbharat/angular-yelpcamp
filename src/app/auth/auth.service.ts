import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';

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
    unreadNotifications: number;
    hideStatsDashboard: boolean;
    error: string;
  }>({
    isUserAuthenticated: false,
    username: null,
    userId: null,
    userAvatar: null,
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
    private dbService: NgxIndexedDBService
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
    this.http
      .post<{ message: string; newUser: CurrentUser }>(
        `${BACKEND_URL}/signup`,
        userData
      )
      .subscribe(
        (result) => {
          // console.log(result);
          this.currentUser = result.newUser;
          this._updateListeners(this.UPDATE_USER, false, null);
          this.setTimerAndStorage();
          this.router.navigate(['/campgrounds']);
        },
        (error) => {
          console.log('error in user signup', error);
          this.currentUser = null;
          this._updateListeners(
            this.RESET_USER,
            false,
            'Error in registration process!'
          );
        }
      );
  }

  login(username: string, email: string, password: string) {
    const authData: AuthData = {
      username,
      email,
      password,
    };
    return new Promise((resolve, reject) => {
      this.http
        .post<{ message: string; userData: CurrentUser }>(
          `${BACKEND_URL}/login`,
          authData
        )
        .subscribe(
          (response) => {
            this.currentUser = response.userData;
            // console.log('auth service', this.currentUser);
            this._updateListeners(this.UPDATE_USER, false, null);
            this.setTimerAndStorage();
            this.router.navigate(['/campgrounds']);
            resolve({ isSuccess: true, username: this.currentUser.username });
          },
          (error) => {
            // console.log('error logging in', error);
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
      this.http
        .put<{ message: string }>(`${BACKEND_URL}/avatar/me`, {
          userId,
          avatar,
        })
        .subscribe(
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
      this.http
        .put<{ message: string }>(`${BACKEND_URL}/detail/me`, {
          userData,
        })
        .subscribe(
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
      this.http
        .put<{ message: string }>(`${BACKEND_URL}/pwd/me`, {
          userId,
          oldpass,
          newpass,
        })
        .subscribe(
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

  updateNotification(notificationIdArr: string[], isSetRead: boolean): void {
    this.http
      .put<{ message: string }>(`${BACKEND_URL}/notifications/update`, {
        notificationIdArr,
        isSetRead,
      })
      .subscribe(
        async (response) => {
          // console.log(response);

          await this.currentUser.notifications.forEach((notification) => {
            if (notificationIdArr.includes(notification._id)) {
              notification.isRead = isSetRead;
            }
          });

          // Update the local store as well
          this._updateListeners(this.UPDATE_USER, true, null);
        },
        (error) => {
          console.log('auth: user notification update', error);
        }
      );
  }

  deleteNotification(notificationIdArr: string[]): void {
    this.http
      .post<{ message: string }>(`${BACKEND_URL}/notifications/remove`, {
        notificationIdArr,
      })
      .subscribe(
        async (response) => {
          // console.log(response);

          this.currentUser.notifications = await this.currentUser.notifications.filter(
            (notification) => !notificationIdArr.includes(notification._id)
          );

          // Update the local store as well
          this._updateListeners(this.UPDATE_USER, true, null);
        },
        (error) => {
          console.log('auth: user notification update', error);
        }
      );
  }
  /** Update User Specific Requests - ENDs */

  /** User password reset methods - Start */
  requestResetPassword(email: string) {
    return this.http.post<{ message: string }>(`${BACKEND_URL}/reset`, {
      email,
    });
  }

  verifyTokenValidity(token: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.http.get(`${BACKEND_URL}/reset/${token}`).subscribe(
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
      this.http
        .post(`${BACKEND_URL}/reset/${token}`, {
          newpw,
        })
        .subscribe(
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
