import { NgModule } from '@angular/core';

import { PageNotFoundRoutingModule } from './pagenotfound-routing.module';
import { HeaderModule } from '../header/header.module';
import { PageNotFoundComponent } from './pagenotfound.component';

@NgModule({
  declarations: [PageNotFoundComponent],
  imports: [HeaderModule, PageNotFoundRoutingModule],
  exports: [PageNotFoundComponent],
})
export class PageNotFoundModule {}
