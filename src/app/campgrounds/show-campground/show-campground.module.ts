import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularMaterialModule } from '../../angular-material.module';

import { ShowCampgroundComponent } from './show-campground.component';
import { ShowCampgroundRoutingModule } from './show-campground-routing.module';
import { HeaderModule } from '../../header/header.module';

@NgModule({
  declarations: [ShowCampgroundComponent],
  imports: [
    ShowCampgroundRoutingModule,
    HeaderModule,
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    AngularMaterialModule,
  ],
})
export class ShowCampgroundModule {}
