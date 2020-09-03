import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AngularMaterialModule } from '../angular-material.module';

import { HomeComponent } from './home/home.component';
import { HeaderModule } from '../header/header.module';

import { InfoDialogComponent } from './dialog/dialog.component';

@NgModule({
  declarations: [HomeComponent, InfoDialogComponent],
  entryComponents: [InfoDialogComponent],
  imports: [
    HeaderModule,
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class CampgroundsModule {}
