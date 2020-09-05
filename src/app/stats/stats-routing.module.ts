import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllCampgroundsComponent } from './campgrounds/all-camps.component';
import { AllUsersComponent } from './users/all-users.component';

const routes: Routes = [
  { path: 'campgrounds/all', component: AllCampgroundsComponent },
  { path: 'users/all', component: AllUsersComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StatsRoutingModule {}
