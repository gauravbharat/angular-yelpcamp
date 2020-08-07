import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { HomeComponent } from './campgrounds/home/home.component';

const routes: Routes = [
  {
    path: 'campgrounds/show/:campgroundId',
    loadChildren: () =>
      import('./campgrounds/show-campground/show-campground.module').then(
        (m) => m.ShowCampgroundModule
      ),
  },
  {
    path: 'campgrounds/process',
    loadChildren: () =>
      import('./campgrounds/campground-create/campground-create.module').then(
        (m) => m.CampgroundCreateModule
      ),
  },
  { path: 'campgrounds', component: HomeComponent },
  { path: '', component: LandingComponent },
  {
    path: '**',
    loadChildren: () =>
      import('./pagenotfound/pagenotfound.module').then(
        (m) => m.PageNotFoundModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
