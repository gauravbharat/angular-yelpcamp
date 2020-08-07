import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AngularMaterialModule } from '../../angular-material.module';

import { HeaderModule } from '../../header/header.module';
import { CampgroundCreateComponent } from './campground-create.component';
import { CampgroundCreateRoutingModule } from './campground-create-routing.module';

@NgModule({
  declarations: [CampgroundCreateComponent],
  imports: [
    HeaderModule,
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CampgroundCreateRoutingModule,
  ],
})
export class CampgroundCreateModule {}
