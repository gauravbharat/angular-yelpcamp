import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResetAuthGuard } from '../auth/auth.guard';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'reset/:resetToken',
    component: ResetPasswordComponent,
    canActivate: [ResetAuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [ResetAuthGuard],
})
export class AuthRoutingModule {}
