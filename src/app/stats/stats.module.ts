import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Provide Stats Service in this context
import { StatsService } from './stats.service';

import { AngularMaterialModule } from '../angular-material.module';

import { StatsRoutingModule } from './stats-routing.module';
import { HeaderModule } from '../header/header.module';

import { AllCampgroundsComponent } from './campgrounds/all-camps.component';
import { AllUsersComponent } from './users/all-users.component';

@NgModule({
  declarations: [AllCampgroundsComponent, AllUsersComponent],
  imports: [
    CommonModule,
    StatsRoutingModule,
    HeaderModule,
    AngularMaterialModule,
  ],
  providers: [StatsService],
})
export class StatsModule {}
