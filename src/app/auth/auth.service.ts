import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { NgxIndexedDBService } from 'ngx-indexed-db';

import { AuthData, User } from './auth-data.model';
import { environment } from '../../environments/environment';

const BACKEND_URL = `${environment.apiUrl}/users`;

interface CurrentUser {
  id: number;
  userId: string;
  email: string;
  username: string;
  isAdmin: boolean;
  avatar?: string;
  followers?: string[];
  notifications?: string[];
  isPublisher?: boolean;
  isRequestedAdmin?: boolean;
  token: string;
  expiresIn: number;
  tokenTimer?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticated = false;
  private currentUser: CurrentUser | null;
  private indexedDbStore = 'currentUser';

  // Set listener for auth status change, initialize to false
  private authStatusListener = new BehaviorSubject<{
    isUserAuthenticated: boolean;
    username: string;
    error: string;
  }>({ isUserAuthenticated: false, username: null, error: null });

  constructor(
    private http: HttpClient,
    private router: Router,
    private dbService: NgxIndexedDBService
  ) {}

  getToken() {
    return this.currentUser?.token;
  }
  getIsAuth() {
    return this.isAuthenticated;
  }
  getUserId() {
    return this.currentUser?.userId;
  }

  getAuthStatusListener() {
    // Subscibe here people
    return this.authStatusListener.asObservable();
  }

  register(userData: User) {
    this.http
      .post<{ message: string; newUser: CurrentUser }>(
        `${BACKEND_URL}/signup`,
        userData
      )
      .subscribe(
        (result) => {
          console.log(result);
          this.currentUser = result.newUser;
          this.isAuthenticated = true;
          this.authStatusListener.next({
            isUserAuthenticated: true,
            username: this.currentUser.username,
            error: null,
          });
          this.setTimerAndStorage();
          this.router.navigate(['/campgrounds']);
        },
        (error) => {
          console.log('error in user signup', error);
          this.isAuthenticated = false;
          this.authStatusListener.next({
            isUserAuthenticated: false,
            username: null,
            error: 'Error in registration process!',
          });
        }
      );
  }

  login(username: string, email: string, password: string) {
    const authData: AuthData = {
      username,
      email,
      password,
    };

    this.http
      .post<{ message: string; userData: CurrentUser }>(
        `${BACKEND_URL}/login`,
        authData
      )
      .subscribe(
        (response) => {
          this.currentUser = response.userData;
          this.isAuthenticated = true;
          this.authStatusListener.next({
            isUserAuthenticated: true,
            username: this.currentUser.username,
            error: null,
          });
          this.setTimerAndStorage();
          this.router.navigate(['/campgrounds']);
        },
        (error) => {
          // console.log('error logging in', error);
          this.isAuthenticated = false;
          this.authStatusListener.next({
            isUserAuthenticated: false,
            username: null,
            error: 'Login failed, invalid credentials!',
          });
        }
      );
  }

  logout() {
    clearTimeout(this.currentUser?.tokenTimer);
    this.clearAuthData();
    this.currentUser = null;
    this.isAuthenticated = false;
    this.authStatusListener.next({
      isUserAuthenticated: false,
      username: null,
      error: null,
    });
    this.router.navigate(['/campgrounds']);
  }

  /** Auto-login user if we have the auth-data available in localStorage
   * But check that the token is not expired
   * Call this from app component
   */
  autoLoginUser() {
    const authInformation = this.getAuthData();
    if (authInformation) {
      const now = new Date();
      const expiresIn =
        authInformation.expirationDate.getTime() - now.getTime();

      if (expiresIn > 0) {
        // if token is not expired yet
        this.dbService.getByKey(this.indexedDbStore, 1).then(
          (userData) => {
            // console.log("this.dbService.getByKey('currentUser', 1)", userData);
            if (userData) {
              this.currentUser = userData;
              this.isAuthenticated = true;
              this.authStatusListener.next({
                isUserAuthenticated: true,
                username: this.currentUser.username,
                error: null,
              });
              this.setTimerAndStorage();
              // this.router.navigate(['/campgrounds']); //bug
              return;
            }
          },
          (error) => {
            console.log(
              "error getting persisted user login from user's browser",
              error
            );
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
}
