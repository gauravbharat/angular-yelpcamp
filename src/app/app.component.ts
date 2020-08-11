import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'ay-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'angular-yelpcamp';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    /** Check if there is any last unexpired login token for user in the
     * user browser's localStorage and indexedDB (user NOT logged-out),
     * If yes, login the user */
    this.authService.autoLoginUser();
  }
}
