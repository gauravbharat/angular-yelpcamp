import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';

import { User } from '../auth-data.model';
import { AuthService } from '../auth.service';

@Component({
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  isLoading = false;
  hide = true;

  private authStatusSub$: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authStatusSub$ = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        // success or failure of the operation, this.authService.register(), stop spinner
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    this.authStatusSub$.unsubscribe();
  }

  onRegister(form: NgForm) {
    if (form.invalid) return;

    const userData: User = {
      username: form.value.username,
      password: form.value.password,
      firstName: form.value.firstname,
      lastName: form.value.lastname,
      email: form.value.email,
      isAdmin: true,
      isPublisher: true,
      isRequestedAdmin: false,
    };

    console.log(userData);

    return;

    this.isLoading = true;
    this.authService.register(userData);
  }
}
