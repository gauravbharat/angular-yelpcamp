import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { AuthData, User } from './auth-data.model';
import { environment } from '../../environments/environment';

const BACKEND_URL = `${environment.apiUrl}/user`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticated = false;
  private userId: string;
  private token: string;
  private tokenTimer: any;

  // Set listener for auth status change, initialize to false
  private authStatusListener = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {}

  getToken() {
    return this.token;
  }
  getIsAuth() {
    return this.isAuthenticated;
  }
  getUserId() {
    return this.userId;
  }

  getAuthStatusListener() {
    // Subscibe here people
    return this.authStatusListener.asObservable();
  }

  register(userData: User) {
    this.http.post(`${BACKEND_URL}/signup`, userData).subscribe(
      () => {
        this.router.navigate(['/']);
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
      .post<{ token: string; expiresIn: number; userId: string }>(
        `${BACKEND_URL}/login`,
        authData
      )
      .subscribe(
        (response) => {
          console.log(response);
        },
        (error) => {
          console.log('error logging in', error);
          this.authStatusListener.next(false);
        }
      );
  }
}
