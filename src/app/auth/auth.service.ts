import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { AuthData, User } from './auth-data.model';
import { environment } from '../../environments/environment';

const BACKEND_URL = `${environment.apiUrl}/users`;

interface CurrentUser {
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
  tokenTimer: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticated = false;
  private currentUser: CurrentUser | null;

  // Set listener for auth status change, initialize to false
  private authStatusListener = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {}

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
          this.authStatusListener.next(true);
          this.router.navigate(['/campgrounds']);
        },
        (error) => {
          console.log('error in user signup', error);
          this.authStatusListener.next(false);
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
          this.authStatusListener.next(true);
          this.router.navigate(['/campgrounds']);
        },
        (error) => {
          console.log('error logging in', error);
          this.authStatusListener.next(false);
        }
      );
  }

  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
  }
}
