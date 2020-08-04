import { NgModule } from '@angular/core';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';

@NgModule({
  exports: [
    MatToolbarModule,
    MatRippleModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatGridListModule,
    MatDividerModule,
  ],
})
export class AngularMaterialModule {}
