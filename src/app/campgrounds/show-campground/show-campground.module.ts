import { NgModule } from '@angular/core';

import { AngularMaterialModule } from '../../angular-material.module';

import { ShowCampgroundComponent } from './show-campground.component';
import { ShowCampgroundRoutingModule } from './show-campground-routing.module';
import { HeaderModule } from '../../header/header.module';

@NgModule({
  declarations: [ShowCampgroundComponent],
  imports: [ShowCampgroundRoutingModule, HeaderModule, AngularMaterialModule],
})
export class ShowCampgroundModule {}
