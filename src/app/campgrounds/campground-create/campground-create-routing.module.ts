import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CampgroundCreateComponent } from './campground-create.component';

const routes: Routes = [
  { path: 'new', component: CampgroundCreateComponent },
  {
    path: 'edit/:campgroundId',
    component: CampgroundCreateComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampgroundCreateRoutingModule {}
