import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; //Added by @angular/material
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

/** Custom Angular Modules */
import { AppRoutingModule } from './app-routing.module';
import { AngularMaterialModule } from './angular-material.module';
import { CampgroundsModule } from './campgrounds/campgrounds.module';

/** Custom Angular Components */
import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';

/** Custom Directive - add to declarations */
import { DisableControlDirective } from './utils/disable-control.directive';

@NgModule({
  declarations: [AppComponent, LandingComponent, DisableControlDirective],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    CampgroundsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
