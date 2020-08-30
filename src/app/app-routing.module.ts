import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './auth/auth.guard';

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
    canActivate: [AuthGuard],
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
    path: 'user',
    loadChildren: () =>
      import('./auth/user/user.module').then((m) => m.UserModule),
    canActivate: [AuthGuard],
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
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  providers: [AuthGuard],
})
export class AppRoutingModule {}
