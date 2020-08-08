import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { HomeComponent } from './campgrounds/home/home.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'campgrounds', component: HomeComponent },
  {
    path: 'campgrounds/process',
    loadChildren: () =>
      import('./campgrounds/campground-create/campground-create.module').then(
        (m) => m.CampgroundCreateModule
      ),
  },
  {
    path: 'campgrounds/show/:campgroundId',
    loadChildren: () =>
      import('./campgrounds/show-campground/show-campground.module').then(
        (m) => m.ShowCampgroundModule
      ),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
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
