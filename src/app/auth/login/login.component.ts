import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from '../auth.service';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoading = false;
  hide = true;

  private authStatusSub$: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe((authstatus) => {
        // listen to auth status change, which should happen on calling the auth service login
        // method in onLogin() below. Success or failure, stop the loading spinner/progress-bar
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.authStatusSub$.unsubscribe();
  }

  onLogin(form: NgForm) {
    if (form.invalid) return;
    if (!form.value.email && !form.value.username) return;

    this.isLoading = true;
    this.authService.login(
      form.value.username,
      form.value.email,
      form.value.password
    );
  }
}
