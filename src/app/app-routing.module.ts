import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { HomeComponent } from './campgrounds/home/home.component';

const routes: Routes = [
  {
    path: 'campgrounds/process',
    loadChildren: () =>
      import('./campgrounds/campground-create/campground-create.module').then(
        (m) => m.CampgroundCreateModule
      ),
  },
  { path: 'campgrounds', component: HomeComponent },
  { path: '', component: LandingComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
