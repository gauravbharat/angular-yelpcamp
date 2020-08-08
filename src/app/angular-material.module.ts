import { NgModule } from '@angular/core';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
  exports: [
    MatToolbarModule,
    MatRippleModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatGridListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatIconModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatProgressBarModule,
  ],
})
export class AngularMaterialModule {}
