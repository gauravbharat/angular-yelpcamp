import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AngularMaterialModule } from '../angular-material.module';
import { AuthRoutingModule } from './auth-routing.module';

import { HeaderModule } from '../header/header.module';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

@NgModule({
  declarations: [LoginComponent, RegisterComponent],
  imports: [
    CommonModule,
    FormsModule,
    AngularMaterialModule,
    AuthRoutingModule,
    HeaderModule,
  ],
})
export class AuthModule {}
