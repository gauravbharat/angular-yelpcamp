import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { HomeComponent } from './campgrounds/home/home.component';
import { CampgroundCreateComponent } from './campgrounds/campground-create/campground-create.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'campgrounds', component: HomeComponent },
  { path: 'campgrounds/new', component: CampgroundCreateComponent },
  {
    path: 'campgrounds/edit/:campgroundId',
    component: CampgroundCreateComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
