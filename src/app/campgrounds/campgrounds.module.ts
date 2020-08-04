import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AngularMaterialModule } from '../angular-material.module';

import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './header/header.component';
import { CampgroundCreateComponent } from './campground-create/campground-create.component';

@NgModule({
  declarations: [HomeComponent, HeaderComponent, CampgroundCreateComponent],
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class CampgroundsModule {}
