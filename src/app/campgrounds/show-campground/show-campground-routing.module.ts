import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShowCampgroundComponent } from './show-campground.component';

const routes: Routes = [{ path: '', component: ShowCampgroundComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShowCampgroundRoutingModule {}
