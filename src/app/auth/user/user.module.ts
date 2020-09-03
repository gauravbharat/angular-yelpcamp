import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HeaderModule } from '../../header/header.module';
import { AngularMaterialModule } from '../../angular-material.module';

import { UserRoutingModule } from './user-routing.module';

import { UserComponent } from './user.component';
import {
  ImageDialogComponent,
  PasswordDialogComponent,
} from './dialog/dialog.component';

@NgModule({
  declarations: [UserComponent, ImageDialogComponent, PasswordDialogComponent],
  entryComponents: [ImageDialogComponent, PasswordDialogComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HeaderModule,
    AngularMaterialModule,
    UserRoutingModule,
  ],
})
export class UserModule {}
