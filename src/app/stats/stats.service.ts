import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
const BACKEND_URL = `${environment.apiUrl}`;

@Injectable()
export class StatsService {
  constructor(private _http: HttpClient) {}

  getAllCampgrounds() {
    return this._http.get<{ message: string; allCampgrounds: any }>(
      `${BACKEND_URL}/campgrounds/allCampgrounds`
    );
  }

  getAllUsers() {
    return this._http.get<{ message: string; allUsers: any }>(
      `${BACKEND_URL}/users/allUsers`
    );
  }
}
